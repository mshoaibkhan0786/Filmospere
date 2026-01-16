
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAll(table: string, select: string) {
    let all: any[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data, error } = await supabase
            .from(table)
            .select(select)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error || !data || data.length === 0) break;

        all = [...all, ...data];

        if (data.length < PAGE_SIZE) break;
        page++;
    }
    return all;
}

async function run() {
    console.log('Counting indexable content (Exact Sitemap Logic)...');

    // Movies (All are indexed)
    const movies = await fetchAll('movies', 'id');
    const moviesCount = movies.length;

    // Articles (Only published)
    const articles = await fetchAll('articles', 'id, is_published');
    const articlesCount = articles.filter(a => a.is_published).length;

    // People (Only with bio >= 50 chars)
    const people = await fetchAll('cast', 'tmdb_id, biography');
    const castCount = people.filter(p => p.biography && p.biography.length >= 50).length;

    const staticPages = 12; // Static routes list

    const total = moviesCount + articlesCount + castCount + staticPages;

    console.log('--------------------------------');
    console.log(`Movies: ${moviesCount}`);
    console.log(`Articles: ${articlesCount}`);
    console.log(`People (Cast): ${castCount} (Optimized & Indexed)`);
    console.log(`Static Pages: ${staticPages}`);
    console.log('--------------------------------');
    console.log(`TOTAL INDEXABLE PAGES: ${total}`);
    console.log('--------------------------------');
}

run();
