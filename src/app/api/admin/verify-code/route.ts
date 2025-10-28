import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, addSecurityHeaders } from '@/lib/auth';

/**
 * API Route: Verify Admin Authentication Code
 * 
 * Verifies the authentication code and creates a session token
 * 
 * Security: Rate limited to 5 attempts per 5 minutes per IP
 */

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || '';

export async function POST(request: Request) {
  try {
    // Rate limiting: 5 verification attempts per 5 minutes per IP
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`verify-code:${clientId}`, 5, 5 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfter!);
    }

    const { code } = await request.json();

    // Normalize code: allow users to paste with dashes/spaces; compare normalized
    const normalized = String(code || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ''); // strips '-' and any non-alphanumeric

    if (!normalized || normalized.length !== 20) {
      return NextResponse.json(
        { error: 'Invalid authentication code format' },
        { status: 400 }
      );
    }

    if (!API_ENDPOINT) {
      return NextResponse.json(
        { error: 'API endpoint not configured' },
        { status: 500 }
      );
    }

    // Verify code with Lambda
    const response = await fetch(`${API_ENDPOINT}/admin/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: normalized }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Invalid or expired authentication code' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Create session cookie with enhanced security
    const cookieStore = await cookies();
    
    // Use __Host- prefix for maximum security (requires secure, path=/, no domain)
    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-admin_session' : 'admin_session';
    
    cookieStore.set(cookieName, data.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      // Don't set domain to bind cookie to exact hostname
    });

    const successResponse = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      apiKey: data.sessionToken, // Return token for client-side API calls
      expiresIn: data.expiresIn || 86400, // 24 hours
    });

    return addSecurityHeaders(successResponse);

  } catch (error) {
    console.error('Error verifying admin code:', error);
    return NextResponse.json(
      { error: 'Failed to verify authentication code' },
      { status: 500 }
    );
  }
}
