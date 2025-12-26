// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('Checking for Series and Specific Doraemon Movie...');

    // Check Series Count
    /*
    Note: Supabase JSON filtering on 'data->>contentType' might be slow on large datasets without index,
    checking a small sample or using a different approach might be better if it times out.
    */

    const { count, error } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('data->>contentType', 'series');

    if (error) {
        console.log('Error counting series:', error.message);
    } else {
        console.log(`Total Series found: ${count}`);
    }

    // Check Doraemon specific
    const { data: dMovies } = await supabase
        .from('movies')
        .select('data')
        .ilike('data->>title', '%Stand by Me Doraemon%')
        .limit(5);

    console.log('Doraemon Results:', dMovies?.map(m => m.data.title));
}

run();
