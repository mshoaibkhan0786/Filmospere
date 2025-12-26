
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
    const urls: string[] = [];
    const today = new Date().toISOString();

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
        urls.push(urlTemplate(`${DOMAIN}${p.path}`, today, p.freq, p.priority));
    });
    console.log(`✅ Added ${staticPages.length} static pages.`);

    // 2. Movies - Fetching with Cursor-based Pagination (to avoid deep offset timeouts)
    const MovieBatchSize = 1000;
    let moviesCount = 0;
    let lastMovieId = ''; // IDs are strings (e.g., "tmdb-1234")

    while (true) {
        let query = supabase
            .from('movies')
            .select('id, data, updated_at')
            .order('id', { ascending: true }) // Must order by ID for cursor
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
            const title = m.data?.title || m.title || 'Unknown';

            // Debug Adult Content
            if (['balinsasayaw', 'kulong', 'experimento', 'eks', 'rita', 'arouse', 'bayo', 'ekis', 'kirot', 'anor'].some(k => slug.toLowerCase().includes(k))) {
                const logMsg = `ID:${m.id}|Slug:${slug}|Title:${title}\n`;
                console.log(`\n🔥 MATCH: ${logMsg.trim()}`);
                const logPath = path.resolve(__dirname, 'adult_ids.txt');
                fs.appendFileSync(logPath, logMsg);
            }

            const lastMod = m.updated_at || today;
            urls.push(urlTemplate(`${DOMAIN}/movie/${slug}`, lastMod, 'weekly', 0.8));
        });

        moviesCount += movies.length;
        lastMovieId = movies[movies.length - 1].id; // Move cursor

        // Log progress every 5000
        if (moviesCount % 5000 === 0) console.log(`...fetched ${moviesCount} movies`);
    }
    console.log(`✅ Added ${moviesCount} movies.`);

    // 3. Articles
    const { data: articles, error: articleError } = await supabase
        .from('articles')
        .select('slug, created_at');

    if (articleError) console.error('Error fetching articles:', articleError);
    else if (articles) {
        articles.forEach(a => {
            const lastMod = a.created_at || today;
            urls.push(urlTemplate(`${DOMAIN}/articles/${a.slug}`, lastMod, 'monthly', 0.7)); // Fixed path
        });
        console.log(`✅ Added ${articles.length} articles.`);
    }

    // 4. People - Fetching with Pagination and Filtering
    const PersonBatchSize = 1000;
    let personPage = 0;
    let personAddedCount = 0;
    let personSkippedCount = 0;

    while (true) {
        const { data: people, error: personError } = await supabase
            .from('cast')
            .select('tmdb_id, updated_at, biography')
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
                urls.push(urlTemplate(`${DOMAIN}/person/${p.tmdb_id}`, lastMod, 'monthly', 0.6));
                personAddedCount++;
            } else {
                personSkippedCount++;
            }
        });

        if (people.length < PersonBatchSize) break;
        personPage++;
    }
    console.log(`✅ Added ${personAddedCount} people (Skipped ${personSkippedCount} short bios).`);

    // Build XML
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

    // Write to public/sitemap.xml
    const publicDir = path.resolve(__dirname, '../../public');
    // Ensure public exists (it should)
    if (!fs.existsSync(publicDir)) {
        console.log('Creating public directory...');
        fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(filePath, sitemapContent);
    console.log(`🎉 Sitemap generated at: ${filePath}`);
    console.log(`   Total URLs: ${urls.length}`);
}

main();
