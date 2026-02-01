import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent caching issues with GSC

export async function GET() {
  const baseUrl = 'https://filmospere.com';
  // CRITICAL FIX: Vercel file system returns "2018" for static files (reproducible build epoch).
  // result: GSC ignores the sitemaps because it thinks they are 8 years old.
  // We MUST use the current date to force GSC to crawl.
  const lastMod = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-articles.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-movies.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-people.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      // Cache for 1 hour, but allow revalidation
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
