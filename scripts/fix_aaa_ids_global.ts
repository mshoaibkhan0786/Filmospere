
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

const CONCURRENCY = 5;

async function run() {
    console.log('🚀 Fixing "aaa-person-" IDs globally...');

    let fetchOffset = 3000;
    let totalUpdated = 0;
    let totalScanned = 0;

    while (true) {
        const promises = [];
        for (let i = 0; i < CONCURRENCY; i++) {
            // Fetch 200 per worker
            const start = fetchOffset + (i * 200);
            const end = start + 199;
            promises.push(
                supabase
                    .from('movies')
                    .select('id, data')
                    .range(start, end)
            );
        }

        const results = await Promise.all(promises);
        let foundAny = false;
        const updates: any[] = [];

        results.forEach(res => {
            if (res.data) {
                foundAny = true;
                res.data.forEach((m: any) => {
                    totalScanned++;
                    if (!m.data || !m.data.cast) return;

                    let changed = false;
                    const newCast = m.data.cast.map((c: any) => {
                        if (c.id && typeof c.id === 'string' && c.id.startsWith('aaa-person-')) {
                            changed = true;
                            return { ...c, id: c.id.replace('aaa-person-', 'tmdb-person-') };
                        }
                        return c;
                    });

                    if (changed) {
                        updates.push({
                            id: m.id,
                            data: { ...m.data, cast: newCast }
                        });
                    }
                });
            }
        });

        if (updates.length > 0) {
            // console.log(`   - Found ${updates.length} movies to update in this batch.`);
            const updatePromises = updates.map(u =>
                supabase.from('movies').update({ data: u.data }).eq('id', u.id)
            );
            await Promise.all(updatePromises);
            totalUpdated += updates.length;
        }

        process.stdout.write(`\rScanned: ${totalScanned} | Updated: ${totalUpdated}`);

        if (!foundAny) break;
        fetchOffset += (CONCURRENCY * 200);
    }

    console.log(`\n✅ Complete. Updated ${totalUpdated} movies.`);
}

run();
