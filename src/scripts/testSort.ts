import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSort() {
    console.log('Testing JSON sort...');
    // Try to sort by data->voteCount
    // Note: PostgREST syntax for nested json arrow is usually "col->key"
    // But casting might be implicitly text.

    // Sort Descending
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('data->voteCount', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Sort Error:', error);
    } else {
        console.log('Sort Success? Top 5:');
        data.forEach((m: any) => {
            console.log(`${m.data.title}: ${m.data.voteCount}`);
        });

        // check if actually sorted (text sort '9' > '100'?)
        const counts = data.map((m: any) => m.data.voteCount);
        console.log('Counts:', counts);
    }
}

testSort();
