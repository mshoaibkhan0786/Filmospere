import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://filmospere.com';
  const fs = require('fs');
  const path = require('path');

  const getFileDate = (filename: string) => {
    try {
      const filePath = path.join(process.cwd(), 'public', filename);
      if (fs.existsSync(filePath)) {
        return fs.statSync(filePath).mtime.toISOString();
      }
    } catch (e) {
      console.error(`Error reading date for \${filename}`, e);
    }
    return new Date().toISOString();
  };

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>\n    <loc>${baseUrl}/sitemap-static.xml</loc>\n    <lastmod>${getFileDate('sitemap-static.xml')}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${baseUrl}/sitemap-articles.xml</loc>\n    <lastmod>${getFileDate('sitemap-articles.xml')}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${baseUrl}/sitemap-movies-1.xml</loc>\n    <lastmod>${getFileDate('sitemap-movies-1.xml')}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${baseUrl}/sitemap-people-1.xml</loc>\n    <lastmod>${getFileDate('sitemap-people-1.xml')}</lastmod>\n  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
