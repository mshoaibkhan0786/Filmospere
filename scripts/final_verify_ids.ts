
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('🔍 Final Verification Scan (Serial)...');

    let fetchOffset = 0;
    let totalMoviesWithAaa = 0;
    let scanned = 0;

    while (true) {
        // Fetch 1000 at a time serially
        const { data: movies, error } = await supabase
            .from('movies')
            .select('id, data')
            .range(fetchOffset, fetchOffset + 999);

        if (error) {
            console.error('Fetch Error:', error);
            break;
        }
        if (!movies || movies.length === 0) break;

        movies.forEach(m => {
            scanned++;
            if (m.data?.cast) {
                let hasAaa = false;
                m.data.cast.forEach((c: any) => {
                    if (c.id && typeof c.id === 'string' && c.id.startsWith('aaa-person-')) {
                        hasAaa = true;
                    }
                });
                if (hasAaa) totalMoviesWithAaa++;
            }
        });

        // console.log(`   Batch ${fetchOffset/1000}: Scanned ${movies.length}, Found ${totalMoviesWithAaa} cumulative.`);
        fetchOffset += 200;
        await new Promise(r => setTimeout(r, 50));
        process.stdout.write(`\rScanned: ${scanned} | Found: ${totalMoviesWithAaa} aaa-person- IDs`);
    }

    console.log(`\n\n✅ Final Results:`);
    console.log(`   - Total Scanned: ${scanned}`);
    console.log(`   - Total Bad IDs: ${totalMoviesWithAaa}`);
}

check();
