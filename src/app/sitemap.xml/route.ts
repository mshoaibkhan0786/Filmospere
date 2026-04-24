import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://filmospere.com/sitemap-static.xml</loc>
    <lastmod>2026-04-24T05:10:46.508Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://filmospere.com/sitemap-articles.xml</loc>
    <lastmod>2026-04-24T05:10:46.508Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://filmospere.com/sitemap-movies-1.xml</loc>
    <lastmod>2026-04-24T05:10:46.508Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://filmospere.com/sitemap-people-1.xml</loc>
    <lastmod>2026-04-24T05:10:46.508Z</lastmod>
  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
