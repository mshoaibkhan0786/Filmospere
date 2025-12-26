
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function compare() {
    const slug = 'ronth-2025';
    console.log(`Analyzing: ${slug}`);

    // 1. Fetch from Cache
    console.log('--- CACHE (home_feed) ---');
    const { data: cacheData } = await supabase
        .from('home_cache')
        .select('content')
        .eq('id', 'home_feed')
        .single();

    let cacheMovie: any = null;
    if (cacheData?.content?.sections) {
        cacheData.content.sections.forEach((s: any) => {
            if (s.data) {
                const found = s.data.find((m: any) => m.slug === slug || m.title.toLowerCase().includes('vidaa'));
                if (found) {
                    cacheMovie = found;
                }
            }
        });
    }

    if (cacheMovie) {
        console.log('ID:', cacheMovie.id);
        console.log('Director:', `"${cacheMovie.director}"`); // Quotes to see exact string
        console.log('Director Type:', typeof cacheMovie.director);
        console.log('Poster:', cacheMovie.posterUrl);
    } else {
        console.log('Not found in cache.');
    }

    // 2. Fetch from DB
    console.log('\n--- LIVE DB ---');
    const { data: dbData } = await supabase
        .from('movies')
        .select('id, data')
        .eq('data->>slug', slug)
        .maybeSingle();

    if (dbData) {
        console.log('ID:', dbData.id);
        console.log('Director:', `"${dbData.data.director}"`);
    } else {
        console.log('Not found in DB.');
    }
}

compare();
