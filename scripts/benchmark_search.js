
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function benchmark() {
    console.log('--- BENCHMARKING SEARCH PERFORMANCE ---');

    console.log('\n1. TITLE SEARCH (Should use movies_title_trgm_idx)');
    const t1 = performance.now();
    const res1 = await supabase
        .from('movies')
        .select('id')
        .ilike('data->>title', '%Avatar%')
        .limit(20);
    const t2 = performance.now();
    console.log(`Time: ${(t2 - t1).toFixed(2)}ms | Rows: ${res1.data?.length}`);

    console.log('\n2. DIRECTOR SEARCH (Should use movies_director_trgm_idx)');
    const t3 = performance.now();
    const res2 = await supabase
        .from('movies')
        .select('id')
        .ilike('data->>director', '%Nolan%')
        .limit(20);
    const t4 = performance.now();
    console.log(`Time: ${(t4 - t3).toFixed(2)}ms | Rows: ${res2.data?.length}`);

    console.log('\n3. CAST SEARCH (Likely Unindexed / Full Scan)');
    const t5 = performance.now();
    const res3 = await supabase
        .from('movies')
        .select('id')
        .ilike('data->>cast', '%Pratik%') // Searching inside the JSON text representation
        .limit(20);
    const t6 = performance.now();
    console.log(`Time: ${(t6 - t5).toFixed(2)}ms | Rows: ${res3.data?.length}`);

    if ((t6 - t5) > (t2 - t1) * 2) {
        console.log('\n⚠️  CONCLUSION: Cast search is significantly slower (missing index).');
    } else {
        console.log('\n✅ CONCLUSION: All searches seem efficient.');
    }
}

benchmark();
