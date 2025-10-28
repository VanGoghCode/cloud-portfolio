/**
 * Server-side authentication utilities
 * 
 * Provides session validation, CSRF protection, and security helpers
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export interface SessionValidationResult {
  valid: boolean;
  sessionToken?: string;
  error?: string;
}

/**
 * Validate admin session on the server side
 */
export async function validateAdminSession(): Promise<SessionValidationResult> {
  try {
    const cookieStore = await cookies();
    
    // Check both cookie names (dev and prod)
    const sessionCookie = cookieStore.get('admin_session') || 
                          cookieStore.get('__Host-admin_session');

    if (!sessionCookie) {
      return { valid: false, error: 'No session cookie found' };
    }

    // Optional: Validate token with backend if you have a verify endpoint
    // For now, presence of HttpOnly cookie is sufficient as it can only be set by our verify endpoint
    return { 
      valid: true, 
      sessionToken: sessionCookie.value 
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false, error: 'Session validation failed' };
  }
}

/**
 * Generate CSRF token for a session
 */
export async function generateCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  
  // Check if we already have a token
  let csrfToken = cookieStore.get('csrf_token')?.value;
  
  if (!csrfToken) {
    // Generate new token
    csrfToken = generateRandomToken(32);
    
    cookieStore.set('csrf_token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
  }
  
  return csrfToken;
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  
  const cookieStore = await cookies();
  const storedToken = cookieStore.get('csrf_token')?.value;
  
  if (!storedToken) return false;
  
  // Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(token, storedToken);
}

/**
 * Generate cryptographically secure random token
 */
function generateRandomToken(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // Fallback for Node.js environment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    nodeCrypto.randomFillSync(randomValues);
  }
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  
  return result;
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Rate limiting store (in-memory, consider Redis for production)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for an identifier
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000 // 5 minutes
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || record.resetAt < now) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

/**
 * Create a rate-limited response
 */
export function createRateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { 
      error: 'Too many requests. Please try again later.',
      retryAfter 
    },
    { 
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
      }
    }
  );
}

/**
 * Get client identifier for rate limiting (IP-based)
 */
export function getClientIdentifier(request: Request): string {
  // Try multiple headers for real IP (considering proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
  
  return `ip:${ip.trim()}`;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
