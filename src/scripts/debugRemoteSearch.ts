// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    const query = 'doraemon';
    console.log(`Running search for: "${query}"`);

    const { data, count, error } = await supabase
        .from('movies')
        .select('title, data', { count: 'exact' })
        .ilike('title', `%${query}%`)
        .limit(20);

    if (error) {
        console.error('Search error:', error);
        return;
    }

    console.log(`Found ${count} results.`);
    console.log('--- Top 20 Matches ---');
    data.forEach((row, i) => {
        console.log(`${i + 1}. [Col: ${row.title}] [JSON: ${row.data.title}]`);
    });
}

run();
