
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load Environment Variables
dotenv.config({ path: path.resolve('c:\\WEB DEV\\Filmospere\\Filmospere Repo\\.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// List of all sections to cache (matching ConfigContext + Constants)
const SECTIONS_TO_CACHE = [
    { title: 'Trending Now', type: 'trending', link: '/section/trending' },
    { title: 'Latest Movies & Series', type: 'latest', link: '/section/new-releases' },
    { title: 'Web Series', type: 'series', link: '/section/web-series' },
    // Main Categories
    { title: 'Action', type: 'Action', link: '/section/action' },
    { title: 'Adventure', type: 'Adventure', link: '/section/adventure' },
    { title: 'Animation', type: 'Animation', link: '/section/animation' },
    { title: 'Comedy', type: 'Comedy', link: '/section/comedy' },
    { title: 'Crime', type: 'Crime', link: '/section/crime' },
    { title: 'Documentary', type: 'Documentary', link: '/section/documentary' },
    { title: 'Drama', type: 'Drama', link: '/section/drama' },
    { title: 'Family', type: 'Family', link: '/section/family' },
    { title: 'Fantasy', type: 'Fantasy', link: '/section/fantasy' },
    { title: 'Horror', type: 'Horror', link: '/section/horror' },
    { title: 'Mystery', type: 'Mystery', link: '/section/mystery' },
    { title: 'Romance', type: 'Romance', link: '/section/romance' },
    { title: 'Science Fiction', type: 'Science Fiction', link: '/section/science-fiction' },
    { title: 'Thriller', type: 'Thriller', link: '/section/thriller' }
];

async function fetchMovies(type: string, count = 20) {
    console.log(`   Fetching ${type}...`);
    let query = supabase.from('movies').select('id, data');

    // Default Query Base
    query = query
        .not('data->>posterUrl', 'is', null)
        .neq('data->>posterUrl', 'N/A')
        .neq('data->>posterUrl', '');

    if (type === 'trending') {
        query = query.order('data->voteCount', { ascending: false });
    } else if (type === 'latest') {
        query = query.order('data->releaseYear', { ascending: false }).order('data->voteCount', { ascending: false });
    } else if (type === 'series') {
        query = query.eq('data->>contentType', 'series').order('data->voteCount', { ascending: false });
    } else {
        // Genre Tags (Case Insensitive / Array Contains)
        // Ensure we capitalize for title case match if needed, but 'contains' is safer with array
        // 'Science Fiction' vs 'Sci-Fi' handling
        let searchTag = type;
        if (type === 'Science Fiction') searchTag = 'Sci-Fi';

        // Use ILIKE for broad matching in JSON array text representation (most robust) or contains
        // MovieContext uses .contains for exact tag match usually.
        query = query.contains('data', { tags: [searchTag] }).order('data->voteCount', { ascending: false });
    }

    const { data, error } = await query.limit(count);

    if (error) {
        console.error(`Error fetching ${type}:`, error.message);
        return [];
    }

    if (!data || data.length === 0) {
        // Fallback for empty strict matches (e.g. Science Fiction might be Sci-Fi in DB)
        // console.log(`      No results for ${type}, trying loose match...`);
        // (Optional: Add retry logic here if needed)
    }

    return (data || []).map((row: any) => ({
        ...row.data,
        id: row.id,
        // Ensure critical fields for Home Card
        posterUrl: row.data.posterUrl || row.data.poster_path || '',
        title: row.data.title || row.data.name,
        rating: row.data.rating || 0,
        releaseYear: row.data.releaseYear,
        slug: row.data.slug,
        contentType: row.data.contentType || 'movie',
        voteCount: row.data.voteCount || 0
    }));
}

async function updateHomeCache() {
    console.log('🚀 Refreshing Home Page Cache (All Sections)...');
    const startTime = Date.now();

    try {
        const sectionsData = [];

        // Parallel Fetch with Limit? Map might be too many connections at once?
        // Let's do batches of 5 to be safe against Supabase connection limits
        const BATCH_SIZE = 5;
        for (let i = 0; i < SECTIONS_TO_CACHE.length; i += BATCH_SIZE) {
            const batch = SECTIONS_TO_CACHE.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(batch.map(async (sec) => {
                const movies = await fetchMovies(sec.type, 20);
                return {
                    title: sec.title,
                    data: movies,
                    link: sec.link
                };
            }));
            sectionsData.push(...results);
        }

        const cacheContent = {
            updatedAt: new Date().toISOString(),
            sections: sectionsData
        };

        console.log(`\n📦 Fetched ${sectionsData.length} sections. Writing to DB...`);

        const { error } = await supabase
            .from('home_cache')
            .upsert({
                id: 'home_feed',
                content: cacheContent,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Success! Home Cache updated in ${duration}s`);

    } catch (e: any) {
        console.error('❌ Failed to update home cache:', e.message);
    }
}

updateHomeCache();
