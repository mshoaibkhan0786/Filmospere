import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://filmospere.com';
  
  let lastmod = new Date().toISOString(); // fallback
  try {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap-movies-1.xml');
    const stat = fs.statSync(sitemapPath);
    lastmod = stat.mtime.toISOString();
  } catch (e) {
    // default to fallback if file stat fails
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>\n    <loc>${baseUrl}/sitemap-static.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${baseUrl}/sitemap-articles.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${baseUrl}/sitemap-movies-1.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${baseUrl}/sitemap-people-1.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
