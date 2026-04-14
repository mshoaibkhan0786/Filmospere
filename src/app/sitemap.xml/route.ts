import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://filmospere.com';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>\n    <loc>${baseUrl}/sitemap-static.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>${baseUrl}/sitemap-articles.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>${baseUrl}/sitemap-movies-1.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>${baseUrl}/sitemap-people-1.xml</loc>\n  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
