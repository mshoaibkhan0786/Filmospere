import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY!, { auth: { persistSession: false } });

async function check() {
    console.log('Checking for duplicates...');

    // Fetch all IDs
    let allCast: { tmdb_id: string }[] = [];
    let offset = 0;
    while (true) {
        const { data: chunk } = await supabase.from('cast').select('tmdb_id').range(offset, offset + 999);
        if (!chunk || chunk.length === 0) break;
        allCast = allCast.concat(chunk);
        offset += 1000;
        process.stdout.write(`\rLoaded ${allCast.length} rows...`);
    }
    console.log('\nFinished loading.');

    if (allCast.length === 0) return;

    const numericIds = new Map();
    let duplicates = 0;

    allCast.forEach(c => {
        const match = c.tmdb_id.match(/-(\d+)$/) || c.tmdb_id.match(/^(\d+)$/);
        if (match) {
            const id = match[1];
            if (numericIds.has(id)) {
                duplicates++;
                if (duplicates <= 5) {
                    console.log(`Duplicate found: ID ${id} has multiple entries: ${numericIds.get(id)} AND ${c.tmdb_id}`);
                }
            } else {
                numericIds.set(id, c.tmdb_id);
            }
        }
    });

    console.log(`\nTotal Rows: ${allCast.length}`);
    console.log(`Total Duplicates Found: ${duplicates}`);
}

check();
