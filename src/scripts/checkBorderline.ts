import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Env Vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function check() {
    console.log('Checking for specific borderline movies...');
    const queries = ['365 Days', 'Fifty Shades', 'Nymphomaniac', 'Love', 'Gaspar Noé'];

    for (const q of queries) {
        const { data } = await supabase.from('movies').select('id, title, data->adult, data->hiddenTags').ilike('title', `%${q}%`);
        if (data && data.length > 0) {
            console.log(`\nFound matches for "${q}":`);
            data.forEach(m => console.log(`- [${m.id}] ${m.title} (Adult: ${m.adult || 'false'}, Tags: ${m.hiddenTags})`));
        } else {
            console.log(`\nNo matches for "${q}"`);
        }
    }
}

check();
