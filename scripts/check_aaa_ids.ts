
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
    console.log('🔍 Scanning ALL movies for "aaa-person-" IDs...');

    let fetchOffset = 0;
    let totalMoviesWithAaa = 0;
    let totalRefererences = 0;
    let scanned = 0;

    const CONCURRENCY = 20;
    while (true) {
        const promises = [];
        for (let i = 0; i < CONCURRENCY; i++) {
            promises.push(
                supabase
                    .from('movies')
                    .select('id, data')
                    .range(fetchOffset + (i * 1000), fetchOffset + ((i + 1) * 1000) - 1)
            );
        }

        const results = await Promise.all(promises);
        let foundAny = false;

        results.forEach(res => {
            if (res.data) {
                foundAny = true;
                res.data.forEach((m: any) => {
                    scanned++;
                    if (m.data?.cast) {
                        let hasAaa = false;
                        m.data.cast.forEach((c: any) => {
                            if (c.id && typeof c.id === 'string' && c.id.startsWith('aaa-person-')) {
                                hasAaa = true;
                                totalRefererences++;
                            }
                        });
                        if (hasAaa) totalMoviesWithAaa++;
                    }
                });
            }
        });

        if (!foundAny || scanned >= 2000) break;
        fetchOffset += (CONCURRENCY * 1000);
        process.stdout.write(`\rScanned: ${scanned} | Movies with 'aaa-': ${totalMoviesWithAaa}`);
    }

    console.log(`\n\n📊 Final Report:`);
    console.log(`   - Total Movies Scanned: ${scanned}`);
    console.log(`   - Movies containing 'aaa-person-' IDs: ${totalMoviesWithAaa}`);
    console.log(`   - Total 'aaa-person-' references: ${totalRefererences}`);
}

check();
