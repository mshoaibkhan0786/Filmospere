// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('Inspecting Money Heist Record...');

    // Check by ID (we know it is tmdb-71446)
    const { data, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .eq('id', 'tmdb-71446')
        .single();

    if (data) {
        console.log(`Found: ${data.id}`);
        console.log(`Column Title: "${data.title}"`);
        console.log(`JSON Title: "${data.data.title}"`);
        console.log(`JSON Original Title: "${data.data.originalTitle}"`);
    } else {
        console.log('Record tmdb-71446 NOT FOUND.');
    }

    console.log('\n--- Checking "Lord..." anomaly ---');
    const query = 'money heist';
    const { data: searchResults } = await supabase
        .from('movies')
        .select('title')
        .ilike('title', `%${query}%`)
        .limit(5);

    console.log(`Search for "${query}" returns:`);
    searchResults?.forEach(m => console.log(`- ${m.title}`));
}

run();
