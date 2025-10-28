import { NextResponse } from 'next/server';
import { validateAdminSession, addSecurityHeaders, checkRateLimit, getClientIdentifier, createRateLimitResponse } from '@/lib/auth';

/**
 * API Route: Create Blog Post
 * 
 * Creates a new blog post (requires valid admin session)
 * 
 * Security: Session validation, rate limiting, CSRF protection
 */

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || '';

export async function POST(request: Request) {
  try {
    // Rate limiting: 10 blog posts per hour per IP
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`create-blog:${clientId}`, 10, 60 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfter!);
    }

    // Validate admin session using our utility
    const sessionValidation = await validateAdminSession();
    
    if (!sessionValidation.valid) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const blogData = await request.json();

    // Validate required fields
    if (!blogData.title || !blogData.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Sanitize and validate data
    if (blogData.title.length > 200) {
      return NextResponse.json(
        { error: 'Title is too long (max 200 characters)' },
        { status: 400 }
      );
    }

    if (blogData.content.length > 100000) {
      return NextResponse.json(
        { error: 'Content is too long (max 100KB)' },
        { status: 400 }
      );
    }

    if (!API_ENDPOINT) {
      return NextResponse.json(
        { error: 'API endpoint not configured' },
        { status: 500 }
      );
    }

    // Create blog post via Lambda with session token
    const response = await fetch(`${API_ENDPOINT}/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionValidation.sessionToken}`,
      },
      body: JSON.stringify(blogData),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to create blog post' },
        { status: response.status }
      );
    }

    const data = await response.json();

    const successResponse = NextResponse.json({
      success: true,
      message: 'Blog post created successfully',
      blog: data.blog,
    });

    return addSecurityHeaders(successResponse);

  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
