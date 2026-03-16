import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Block direct access via .netlify.app
  // This prevents bots from bypassing Cloudflare by hitting the Netlify URL directly
  if (hostname.includes('.netlify.app')) {
    // Return a lightweight 403 Forbidden response to save Netlify bandwidth
    return new NextResponse('Access Denied. Please visit https://filmospere.com', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
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
