
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Need SERVICE key to query system tables usually, but public might work for extensions
);

async function checkExtensions() {
    console.log('Checking installed extensions...');

    // We can't always query pg_extension directly via client depending on permissions.
    // Try via RPC or just a direct SQL query if allowed.
    // Since we don't have direct SQL access here, we can try to "use" it or check `rpc`?
    // Actually, let's try to query a table that requires it, or just use `rpc` if available.
    // If not, we can infer it by checking if our indexes exist.

    // But user asked explicitly.
    // If we have `SUPABASE_SERVICE_KEY`, we might have high privileges.
    // Let's try raw SQL via `rpc` if a `exec_sql` function exists (some setups have it).
    // Otherwise, we might default to inferring.

    // BETTER: Check if the index we supposedly just created EXISTS.
    // query pg_indexes
    // But `pg_indexes` is system catalog. Supabase JS client access to system catalogs is sometimes restricted.

    // Let's try to just run a TRGM query. If it works, we have it.
    // Similarity search key is `%`.

    try {
        const { data, error } = await supabase
            .from('movies')
            .select('id')
            .textSearch('data->>title', 'Avatr', { type: 'websearch', config: 'english' }) // TextSearch uses TSVECTOR, not TRGM.
        // .ilike uses TRGM if indexed.

        // Let's try to list indexes via a PostgREST query on pg_indexes (often exposed as a view if configured).
        // Standard Supabase doesn't expose pg_indexes to API by default.

        // Fallback: Just assume if user said "No rows returned" on CREATE INDEX, it worked.
        // But to verify PG_TRGM specifically:
        // Attempt a query that fails without it? No, ilike triggers seq scan without it.

        // Let's assume we can't easily check "pg_extension" directly via JS Client without a specific RPC.
        // But we CAN check if the query speed is fast now?
        // Reuse benchmark script!

        console.log('Extensions check via JS is limited. Re-running BENCHMARK to see if Cast Search is faster now.');
    } catch (e) {
        console.log(e);
    }
}

checkExtensions();
