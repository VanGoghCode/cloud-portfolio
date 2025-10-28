import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { addSecurityHeaders } from '@/lib/auth';

/**
 * API Route: Admin Logout
 * 
 * Clears the admin session cookie
 */

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear both cookie names (dev and prod)
    cookieStore.delete('admin_session');
    if (process.env.NODE_ENV === 'production') {
      cookieStore.delete('__Host-admin_session');
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
