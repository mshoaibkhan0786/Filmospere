import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Redirect direct access via .netlify.app
  // This pushes all traffic to the primary domain immediately
  if (hostname.includes('.netlify.app')) {
    const url = request.nextUrl.clone();
    url.hostname = 'filmospere.com';
    url.port = '';
    url.protocol = 'https:';
    
    return NextResponse.redirect(url, {
      status: 301,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
