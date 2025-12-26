// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('Checking Doraemon Data...');

    // Fetch by slug (preferred) or title
    const { data: movies, error } = await supabase
        .from('movies')
        .select('data')
        .eq('data->>slug', 'doraemon')
        .single();

    // Fallback if slug lookup fails (for safety)
    if (!movies) {
        console.log('Slug lookup failed, trying title search...');
        const { data: searchData } = await supabase
            .from('movies')
            .select('data')
            .ilike('data->>title', 'Doraemon')
            .limit(1);
        if (searchData && searchData[0]) {
            const m = searchData[0].data;
            console.log(`Found: ${m.title} (${m.id})`);
            console.log('Total Seasons:', m.totalSeasons);
            console.log('Seasons Array:', m.seasons ? `${m.seasons.length} items` : 'UNDEFINED');
            return;
        }
    }

    if (movies) {
        const m = movies.data;
        console.log(`Found: ${m.title} (${m.id})`);
        console.log('Total Seasons:', m.totalSeasons);
        console.log('Seasons Array:', m.seasons ? JSON.stringify(m.seasons.slice(0, 1), null, 2) : 'UNDEFINED');
    } else {
        console.log('❌ Doraemon not found.');
    }
}

run();
