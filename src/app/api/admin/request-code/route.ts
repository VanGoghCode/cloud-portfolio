import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, addSecurityHeaders } from '@/lib/auth';

/**
 * API Route: Request Admin Authentication Code
 * 
 * Generates a random 20-character code and sends it to the admin email
 * The code is stored temporarily (5 minutes expiry)
 * 
 * Security: Rate limited to 3 requests per 5 minutes per IP
 */

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || '';

export async function POST(request: Request) {
  try {
    // Rate limiting: 3 requests per 5 minutes per IP
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`request-code:${clientId}`, 3, 5 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfter!);
    }

    if (!API_ENDPOINT) {
      return NextResponse.json(
        { error: 'API endpoint not configured' },
        { status: 500 }
      );
    }

    // Call Lambda function to generate and send code
    const response = await fetch(`${API_ENDPOINT}/admin/request-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to send authentication code' },
        { status: response.status }
      );
    }

    const data = await response.json();

    const successResponse = NextResponse.json({
      success: true,
      message: 'Authentication code sent to your email',
      expiresIn: data.expiresIn || 300, // 5 minutes
    });

    return addSecurityHeaders(successResponse);

  } catch (error) {
    console.error('Error requesting admin code:', error);
    return NextResponse.json(
      { error: 'Failed to request authentication code' },
      { status: 500 }
    );
  }
}
