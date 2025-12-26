
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('Counting total movies...');
    const { count: total } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true });

    console.log('Counting optimized movies (via whyWatch presence)...');
    // We check for 'whyWatch' being present in the JSON data
    const { count: optimized, error } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .not('data->>whyWatch', 'is', null);

    if (error) console.error('Error counting optimized:', error);

    console.log(`Total: ${total}`);
    // If 'optimized' is null/undefined, it means 0 or error
    console.log(`Optimized: ${optimized || 0}`);
    console.log(`Remaining: ${total - (optimized || 0)}`);
}

check();
