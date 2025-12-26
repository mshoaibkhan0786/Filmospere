import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('--- DEBUG INFO ---');

    // 1. Exact count of ALL cast
    const { count: totalCast } = await supabase.from('cast').select('*', { count: 'exact', head: true });
    console.log(`Total rows in 'cast' table: ${totalCast}`);

    // 2. Count of cast with non-null biography
    const { count: bioCast } = await supabase.from('cast').select('*', { count: 'exact', head: true }).not('biography', 'is', null);
    console.log(`Rows with non-null biography: ${bioCast}`);

    // 3. Check movies data structure
    const { data: movies } = await supabase.from('movies').select('data').limit(10);
    let totalActorsSample = 0;
    movies?.forEach(m => {
        if (m.data?.cast && Array.isArray(m.data.cast)) {
            totalActorsSample += m.data.cast.length;
        }
    });
    console.log(`Actors found in first 10 movies: ${totalActorsSample} (Avg: ${totalActorsSample / 10})`);

    // 4. Test default select limit
    const { data: limitedCheck } = await supabase.from('cast').select('tmdb_id').not('biography', 'is', null);
    console.log(`Default select returned: ${limitedCheck?.length} rows`);
}

run();
