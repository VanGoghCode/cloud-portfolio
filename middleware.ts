import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Redirect /blogs to /coming-soon
  if (pathname === '/blogs' || pathname.startsWith('/blogs/')) {
    return NextResponse.redirect(new URL('/coming-soon', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/blogs', '/blogs/:path*'],
};
