
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const DOMAIN = 'https://filmospere.com';

// XML Helpers
const urlTemplate = (loc: string, lastmod?: string, changefreq: string = 'weekly', priority: number = 0.5) => `
    <url>
        <loc>${loc}</loc>
        <lastmod>${lastmod || new Date().toISOString()}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority.toFixed(1)}</priority>
    </url>`;

async function main() {
    console.log('🚀 Starting Sitemap Generation...');
    const today = new Date().toISOString();
    // Arrays to hold URLs for each sitemap
    const staticUrls: string[] = [];
    const movieUrls: string[] = [];
    const articleUrls: string[] = [];
    const personUrls: string[] = [];

    // 1. Static Pages
    const staticPages = [
        { path: '/', priority: 1.0, freq: 'daily' },
        { path: '/articles', priority: 0.9, freq: 'daily' },
        { path: '/section/Latest%20Movies%20%26%20Series', priority: 0.8, freq: 'daily' },
        { path: '/section/Web%20Series', priority: 0.8, freq: 'daily' },
        { path: '/section/Trending', priority: 0.8, freq: 'daily' },
        { path: '/about', priority: 0.3, freq: 'yearly' },
        { path: '/contact', priority: 0.3, freq: 'yearly' },
        { path: '/privacy', priority: 0.1, freq: 'yearly' },
        { path: '/terms', priority: 0.1, freq: 'yearly' },
    ];

    staticPages.forEach(p => {
        staticUrls.push(urlTemplate(`${DOMAIN}${p.path}`, today, p.freq, p.priority));
    });
    console.log(`✅ (Static) Added ${staticPages.length} pages.`);

    // 2. Movies
    const MovieBatchSize = 1000;
    let moviesCount = 0;
    let lastMovieId = '';

    while (true) {
        let query = supabase
            .from('movies')
            .select('id, data, updated_at')
            .order('id', { ascending: true })
            .limit(MovieBatchSize);

        if (lastMovieId) {
            query = query.gt('id', lastMovieId);
        }

        const { data: movies, error: movieError } = await query;

        if (movieError) {
            console.error('Error fetching movies:', movieError);
            break;
        }

        if (!movies || movies.length === 0) break;

        movies.forEach(m => {
            const slug = m.data?.slug || m.id;
            const lastMod = m.updated_at || today;
            movieUrls.push(urlTemplate(`${DOMAIN}/movie/${slug}`, lastMod, 'weekly', 0.8));
        });

        moviesCount += movies.length;
        lastMovieId = movies[movies.length - 1].id;
        if (moviesCount % 5000 === 0) console.log(`...fetched ${moviesCount} movies`);
    }
    console.log(`✅ (Movies) Added ${moviesCount} pages.`);

    // 3. Articles
    const { data: articles, error: articleError } = await supabase
        .from('articles')
        .select('slug, created_at');

    if (articleError) console.error('Error fetching articles:', articleError);
    else if (articles) {
        articles.forEach(a => {
            const lastMod = a.created_at || today;
            articleUrls.push(urlTemplate(`${DOMAIN}/articles/${a.slug}`, lastMod, 'monthly', 0.7));
        });
        console.log(`✅ (Articles) Added ${articles.length} pages.`);
    }

    // 4. People
    const PersonBatchSize = 1000;
    let personPage = 0;
    let personAddedCount = 0;
    let personSkippedCount = 0;

    while (true) {
        const { data: people, error: personError } = await supabase
            .from('cast')
            .select('tmdb_id, updated_at, biography, name')
            .not('biography', 'is', null)
            .range(personPage * PersonBatchSize, (personPage + 1) * PersonBatchSize - 1);

        if (personError) {
            console.error('Error fetching people:', personError);
            break;
        }

        if (!people || people.length === 0) break;

        people.forEach(p => {
            if (p.biography && p.biography.length > 50) {
                const lastMod = p.updated_at || today;

                // Create SEO-friendly slug
                const nameSlug = p.name
                    ? p.name.toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, '') // Remove special chars
                        .replace(/\s+/g, '-')     // Spaces to dashes
                        .replace(/-+/g, '-')      // Collapse dashes
                    : 'person';

                // Format: /person/michael-c-hall-tmdb-12345 (or just 12345 if typical)
                // The regex /-([\d]+)$/ handles extracting the ID from the end regardless of prefix
                const finalSlug = `${nameSlug}-${p.tmdb_id}`;

                personUrls.push(urlTemplate(`${DOMAIN}/person/${finalSlug}`, lastMod, 'monthly', 0.6));
                personAddedCount++;
            } else {
                personSkippedCount++;
            }
        });

        if (people.length < PersonBatchSize) break;
        personPage++;
    }
    console.log(`✅ (People) Added ${personAddedCount} pages (Skipped ${personSkippedCount}).`);

    // 5. Sitemap Helpers
    const writeSitemap = (filename: string, urlList: string[]) => {
        const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlList.join('')}
</urlset>`;

        const filePath = path.join(publicDir, filename);
        fs.writeFileSync(filePath, content);
        console.log(`✅ Generated: ${filename} (${urlList.length} URLs)`);
    };

    // --- WRITE SUB-SITEMAPS ---
    const publicDir = path.resolve(__dirname, '../../public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    // Static
    writeSitemap('sitemap-static.xml', staticUrls);

    // Movies (Split if needed, but for now 10k fits in one file easily. Limit is 50k)
    writeSitemap('sitemap-movies.xml', movieUrls);

    // People
    writeSitemap('sitemap-people.xml', personUrls);

    // Articles
    writeSitemap('sitemap-articles.xml', articleUrls);

    // --- GENERATE INDEX ---
    const todaySimple = new Date().toISOString();
    const sitemapIndexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${DOMAIN}/sitemap-static.xml</loc>
        <lastmod>${todaySimple}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${DOMAIN}/sitemap-movies.xml</loc>
        <lastmod>${todaySimple}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${DOMAIN}/sitemap-people.xml</loc>
        <lastmod>${todaySimple}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${DOMAIN}/sitemap-articles.xml</loc>
        <lastmod>${todaySimple}</lastmod>
    </sitemap>
</sitemapindex>`;

    const indexFilePath = path.join(publicDir, 'sitemap-index.xml');
    fs.writeFileSync(indexFilePath, sitemapIndexContent);

    console.log(`🎉 Sitemap Index generated at: ${indexFilePath}`);
    console.log(`   Total URLs: ${staticUrls.length + movieUrls.length + personUrls.length + articleUrls.length}`);
}

main();
