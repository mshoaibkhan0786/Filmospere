// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// Prioritize Anon Key for now to verify connectivity (since app works)
// If Service Key is broken, we'll fix later.
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

// Interfaces for our script
interface Movie {
    id: string;
    // We only need specific fields for the cache to keep it light
    [key: string]: any;
}

interface CacheSection {
    title: string;
    data: Movie[];
}

const SHUFFLE_POOL_SIZE = 150; // Fetch top 150 to pick from
const DISPLAY_COUNT = 40;     // Show 40 on homepage

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function fetchAndRandomize(
    category: 'popular' | 'latest' | 'series',
    poolSize: number,
    pickCount: number
): Promise<Movie[]> {
    // FETCH STRATEGY: 
    // The DB times out when sorting by JSON fields (voteCount/releaseYear) because of missing indexes.
    // SOLUTION: Fetch detailed batches without sorting, then sort in memory (Node.js is fast enough for 10k items).

    // Select essential fields to keep it lighter if possible, but '*' is fine for now
    let query = supabase.from('movies').select('*');

    // Base filters only (No ORDER BY here)
    query = query
        .not('data->>posterUrl', 'is', null)
        .neq('data->>posterUrl', 'N/A')
        .neq('data->>posterUrl', '');

    if (category === 'series') {
        query = query.eq('data->>contentType', 'series');
    }

    // Fetch a larger chunk to ensure we get good candidates
    // We can't fetch ALL 10k easily without pagination, but let's try fetching 2000 latest added IDs?
    // actually default order is usually insertion order.
    // Let's fetch 2000.
    const { data, error } = await query.limit(500);

    if (error) {
        console.error(`Error fetching ${category}:`, error);
        return [];
    }

    if (!data) return [];

    console.log(`Fetched ${data.length} candidates for ${category} (sorting in memory)`);

    // Map to simple objects
    const movies = data.map(row => ({ ...row.data, id: row.id }));

    // IN-MEMORY SORTING
    let candidates = movies;
    if (category === 'popular') {
        candidates.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
    } else if (category === 'latest') {
        candidates.sort((a, b) => (Number(b.releaseYear) || 0) - (Number(a.releaseYear) || 0));
    } else if (category === 'series') {
        candidates.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
    }

    // Take top pool
    candidates = candidates.slice(0, poolSize);

    // Shuffle
    const shuffled = shuffleArray(candidates);
    return shuffled.slice(0, pickCount);
}

async function updateHomeCache() {
    console.log('Starting Home Cache Update...');

    const sections: CacheSection[] = [];

    // 1. Popular (Trending)
    const popularMovies = await fetchAndRandomize('popular', SHUFFLE_POOL_SIZE, DISPLAY_COUNT);
    sections.push({ title: 'Trending', data: popularMovies });

    // 2. Latest
    // For latest, maybe smaller pool to keep it actually "Fresh"
    const latestMovies = await fetchAndRandomize('latest', 100, DISPLAY_COUNT);
    sections.push({ title: 'Latest Movies & Series', data: latestMovies });

    // 3. Web Series
    const seriesMovies = await fetchAndRandomize('series', 100, DISPLAY_COUNT);
    sections.push({ title: 'Web Series', data: seriesMovies });

    // 4. Construct Payload
    // Only save essential fields to keep size down
    const cleanSections = sections.map(sec => ({
        title: sec.title,
        data: sec.data.map(m => ({
            id: m.id,
            title: m.title,
            posterUrl: m.posterUrl,
            backdropUrl: m.backdropUrl,
            rating: m.rating,
            releaseYear: m.releaseYear,
            duration: m.duration,
            tags: m.tags,
            slug: m.slug,
            contentType: m.contentType,
            voteCount: m.voteCount,
            director: m.director,
            description: m.description,
            language: m.language,
            languages: m.languages,
            status: m.status,
            budget: m.budget,
            videos: m.videos,
            // SEO & Meta Fields
            metaTitle: m.metaTitle,
            metaDescription: m.metaDescription,
            keywords: m.keywords
        }))
    }));

    const cachePayload = {
        sections: cleanSections,
        generated_at: new Date().toISOString()
    };

    console.log(`Cache generated. Payload size: ~${JSON.stringify(cachePayload).length / 1024} KB`);

    // 5. Save to Supabase
    const { error } = await supabase
        .from('home_cache')
        .upsert({
            id: 'home_feed',
            content: cachePayload,
            updated_at: new Date()
        });

    if (error) {
        console.error('Failed to update cache:', error);
    } else {
        console.log('✅ Home cache updated successfully!');
    }
}

updateHomeCache();
