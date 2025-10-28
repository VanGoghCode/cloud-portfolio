import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect admin routes (any /admin/* except the login page itself)
  if (pathname.startsWith('/admin') && pathname !== '/admin') {
    // Check if user has admin session (support both cookie names for dev/prod)
    const adminSession = request.cookies.get('admin_session') || 
                         request.cookies.get('__Host-admin_session');
    
    if (!adminSession) {
      // Redirect to admin login page if no session
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Add security headers to admin pages
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }
  
  // Redirect /blogs to /coming-soon
  // if (pathname === '/blogs' || pathname.startsWith('/blogs/')) {
  //   return NextResponse.redirect(new URL('/coming-soon', request.url));
  // }
  
  return NextResponse.next();
}

export const config = {
  // Run middleware for blogs and all admin subpaths
  matcher: ['/blogs', '/blogs/:path*', '/admin/:path*'],
};
