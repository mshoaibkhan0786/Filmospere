
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

const CONCURRENCY = 20;

async function run() {
    console.log('🚀 Fixing Movie Cast References (cast- -> tmdb-person-)...');

    let fetchOffset = 0;
    let totalUpdated = 0;
    let totalScanned = 0;

    while (true) {
        const { data: movies, error } = await supabase
            .from('movies')
            .select('id, data')
            .range(fetchOffset, fetchOffset + 199);

        if (error) {
            console.error('Fetch Error:', error);
            break;
        }
        if (!movies || movies.length === 0) break;

        const updates: any[] = [];

        for (const m of movies) {
            totalScanned++;
            if (!m.data || !m.data.cast) continue;

            let changed = false;
            const newCast = m.data.cast.map((c: any) => {
                if (c.id && c.id.startsWith('cast-')) {
                    changed = true;
                    return { ...c, id: c.id.replace('cast-', 'tmdb-person-') };
                }
                return c;
            });

            if (changed) {
                updates.push({
                    id: m.id,
                    data: { ...m.data, cast: newCast },
                    updated_at: new Date().toISOString()
                });
            }
        }

        if (updates.length > 0) {
            // Process updates in batches
            for (let i = 0; i < updates.length; i += CONCURRENCY) {
                const batch = updates.slice(i, i + CONCURRENCY);
                await Promise.all(batch.map(u =>
                    supabase.from('movies').update({ data: u.data }).eq('id', u.id)
                ));
                totalUpdated += batch.length;
                process.stdout.write(`\rScanned: ${totalScanned} | Updated: ${totalUpdated}`);
            }
        } else {
            process.stdout.write(`\rScanned: ${totalScanned} | Updated: ${totalUpdated}`);
        }

        fetchOffset += 200;
    }

    console.log(`\n✅ Complete. Updated ${totalUpdated} movies.`);
}

run();
