const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const DOMAIN = 'https://filmospere.com';
const MAX_URLS_PER_SITEMAP = 40000;
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// ---------------------------------------------------------
// Helper: Write Sitemap Array to File
// ---------------------------------------------------------
function writeSitemapChunk(filename, urls) {
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    const filePath = path.join(PUBLIC_DIR, filename);
    fs.writeFileSync(filePath, sitemapContent);
    console.log(`✅ Generated ${filename} with ${urls.length} URLs.`);
}

// ---------------------------------------------------------
// 1. Generate Static Pages Sitemap
// ---------------------------------------------------------
function generateStaticSitemap() {
    const staticRoutes = [
        '',
        '/section/trending',
        '/section/web-series',
        '/section/hollywood',
        '/section/bollywood',
        '/section/south indian',
        '/section/anime',
        '/section/top-rated',
        '/section/new-releases',
        '/section/science-fiction',
        '/section/action',
        '/section/comedy',
        '/section/horror',
        '/section/thriller',
        '/section/romance',
        '/articles',
        '/about',
        '/contact',
        '/privacy',
        '/terms'
    ];

    const urls = staticRoutes.map(route => {
        const url = `${DOMAIN}${route}`;
        // Encode URI Component for spaces, but keep slashes
        const encodedUrl = encodeURI(url);
        const today = new Date().toISOString().split('T')[0];
        return `  <url>\n    <loc>${encodedUrl}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`;
    });

    writeSitemapChunk('sitemap-static.xml', urls);
    return 1; // 1 file
}

// ---------------------------------------------------------
// 2. Generate Movies Sitemaps (Offline - Local JSON)
// ---------------------------------------------------------
function generateMoviesSitemaps() {
    console.log('\n🎬 Processing Movies (Offline)...');
    let allMovies = [];
    const files = ['movies_part1.json', 'movies_part2.json', 'movies_part3.json'];

    files.forEach(file => {
        try {
            const filePath = path.join(PUBLIC_DIR, file);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                allMovies = allMovies.concat(data);
                console.log(`Loaded ${data.length} movies from ${file}`);
            } else {
                console.warn(`⚠️ Warning: ${file} not found.`);
            }
        } catch (e) {
            console.error(`❌ Error loading ${file}:`, e.message);
        }
    });

    console.log(`Total Movies Loaded: ${allMovies.length}`);

    // Sort by release path (Newest to oldest) as a simple priority
    allMovies.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));

    // Chunk the arrays
    let chunkIndex = 1;
    let currentChunkUrls = [];
    let totalMovieUrls = 0;

    allMovies.forEach(m => {
        if (!m.title && !m.slug) return; // Skip invalid
        let slug = m.slug;
        if (!slug) {
            const titleSlug = m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            slug = `${titleSlug}-${m.releaseYear || ''}`;
        }
        const url = `${DOMAIN}/movie/${slug}`;

        let priority = '0.6';
        if (m.releaseYear >= 2024 || m.voteCount > 10) priority = '0.9';
        else if (m.releaseYear >= 2020) priority = '0.8';

        const lastMod = m.updated_at ? m.updated_at.split('T')[0] : new Date().toISOString().split('T')[0];

        currentChunkUrls.push(`  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`);
        totalMovieUrls++;

        if (currentChunkUrls.length >= MAX_URLS_PER_SITEMAP) {
            writeSitemapChunk(`sitemap-movies-${chunkIndex}.xml`, currentChunkUrls);
            chunkIndex++;
            currentChunkUrls = [];
        }
    });

    // Write remainder
    if (currentChunkUrls.length > 0) {
        writeSitemapChunk(`sitemap-movies-${chunkIndex}.xml`, currentChunkUrls);
    }

    console.log(`Total Indexed Movies: ${totalMovieUrls} across ${chunkIndex} files`);
    return chunkIndex;
}

// ---------------------------------------------------------
// 3. Generate People Sitemaps (Offline - Actors JSON)
// ---------------------------------------------------------
function generatePeopleSitemaps() {
    console.log('\n🎭 Processing People (Offline)...');
    let validPeople = [];

    try {
        const filePath = path.join(PUBLIC_DIR, 'actors.json');
        if (fs.existsSync(filePath)) {
            const rawPeopleData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const allPeople = Array.isArray(rawPeopleData) ? rawPeopleData : Object.values(rawPeopleData);
            console.log(`Loaded ${allPeople.length} people records.`);

            // Filter: biography > 50 words
            validPeople = allPeople.filter(p => {
                if (!p.biography) return false;
                const words = p.biography.trim().split(/\s+/).length;
                return words > 50; // Index only rich profiles
            });
            console.log(`Filtered down to ${validPeople.length} valid profiles (Bio > 50 words).`);
        } else {
            console.warn(`⚠️ Warning: actors.json not found.`);
        }
    } catch (e) {
        console.error(`❌ Error parsing actors.json:`, e.message);
    }

    let chunkIndex = 1;
    let currentChunkUrls = [];
    let totalPeopleUrls = 0;

    validPeople.forEach(p => {
        if (!p.tmdb_id) return;
        const urlPrefix = p.isDirector ? 'director' : 'person';
        const nameSlug = p.name ? p.name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().replace(/(^-|-$)/g, '') : 'unknown';
        const cleanId = p.tmdb_id.toString().replace(/tmdb-(person|director)-/, '');
        const slugPart = `${nameSlug}-${cleanId}`;
        const url = `${DOMAIN}/${urlPrefix}/${slugPart}`;

        const lastMod = p.updated_at ? p.updated_at.split('T')[0] : new Date().toISOString().split('T')[0];

        currentChunkUrls.push('  <url>\n    <loc>' + url + '</loc>\n    <lastmod>' + lastMod + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>');
        totalPeopleUrls++;

        if (currentChunkUrls.length >= MAX_URLS_PER_SITEMAP) {
            writeSitemapChunk('sitemap-people-' + chunkIndex + '.xml', currentChunkUrls);
            chunkIndex++;
            currentChunkUrls = [];
        }
    });

    // Write remainder
    if (currentChunkUrls.length > 0) {
        writeSitemapChunk('sitemap-people-' + chunkIndex + '.xml', currentChunkUrls);
    }

    console.log(`Total Indexed People: ${totalPeopleUrls} across ${chunkIndex} files`);
    return chunkIndex;
}

// ---------------------------------------------------------
// 4. Generate Articles Sitemap (Light DB Load)
// ---------------------------------------------------------
async function generateArticlesSitemap() {
    console.log('\n📰 Processing Articles (Supabase Pagination)...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Missing Supabase credentials in .env.local. Skipping Articles.');
        return 0;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    let allArticles = [];
    let page = 0;
    const PAGE_SIZE = 1000;

    try {
        while (true) {
            const { data, error } = await supabase
                .from('articles')
                .select('slug, updated_at')
                .eq('is_published', true)
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (error) throw error;
            if (!data || data.length === 0) break;

            allArticles = allArticles.concat(data);
            if (data.length < PAGE_SIZE) break;
            page++;
        }

        console.log(`Loaded ${allArticles.length} active articles from Supabase.`);

        if (allArticles.length === 0) return 0;

        const urls = allArticles.map(a => {
            const url = `${DOMAIN}/article/${a.slug}`;
            const lastMod = a.updated_at ? a.updated_at.split('T')[0] : new Date().toISOString().split('T')[0];
            return '  <url>\n    <loc>' + url + '</loc>\n    <lastmod>' + lastMod + '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>';
        });

        writeSitemapChunk('sitemap-articles.xml', urls);
        console.log(`Total Indexed Articles: ${urls.length} `);
        return 1;

    } catch (e) {
        console.error(`❌ Error fetching articles: `, e.message);
        return 0;
    }
}

// ---------------------------------------------------------
// 5. Generate Next.js App Route configuration mapping
// ---------------------------------------------------------
function generateRouteConfig(movieChunks, peopleChunks) {
    console.log('\n⚙️ Generating route.ts map (src/app/sitemap.xml/route.ts)...');

    const xmlChunks = [
        'sitemap-static.xml',
        'sitemap-articles.xml'
    ];

    for (let i = 1; i <= movieChunks; i++) xmlChunks.push('sitemap-movies-' + i + '.xml');
    for (let i = 1; i <= peopleChunks; i++) xmlChunks.push('sitemap-people-' + i + '.xml');

    const currentDate = new Date().toISOString();
    const sitemapNodesStr = xmlChunks.map(function (chunk) {
        return "  <sitemap>\\n    <loc>${baseUrl}/" + chunk + "</loc>\\n    <lastmod>" + currentDate + "</lastmod>\\n  </sitemap>";
    }).join('\\n');

const routeCode = `import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://filmospere.com';

  const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapNodesStr}
</sitemapindex>\`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
`;

    const routePath = path.join(process.cwd(), 'src/app/sitemap.xml/route.ts');
    fs.writeFileSync(routePath, routeCode);
    console.log(`✅ Updated ${routePath} to serve all new chunks!`);
}

// ---------------------------------------------------------
// 🚀 Main Execution
// ---------------------------------------------------------
async function buildSitemaps() {
    console.log('============================================');
    console.log('🏗️  STARTING ZERO-LOAD SITEMAP GENERATION');
    console.log('============================================\n');

    let totalFiles = 0;

    generateStaticSitemap();
    totalFiles++;

    const movieChunksCount = generateMoviesSitemaps();
    totalFiles += movieChunksCount;

    const peopleChunksCount = generatePeopleSitemaps();
    totalFiles += peopleChunksCount;

    const articleStatus = await generateArticlesSitemap();
    if (articleStatus > 0) totalFiles += articleStatus;

    generateRouteConfig(movieChunksCount, peopleChunksCount);

    console.log('\n============================================');
    console.log(`🎉 SUCCESS: Generated ${totalFiles} sitemap XML files!`);
    console.log('Everything is optimized to protect Supabase allocations.');
    console.log('============================================');
}

buildSitemaps();
