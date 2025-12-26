
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
    console.log("Searching for Shah Rukh Khan's movies...");

    let fetchOffset = 0;
    let allMovies: any[] = [];
    while (true) {
        const { data: chunk, error } = await supabase
            .from('movies')
            .select('*')
            .range(fetchOffset, fetchOffset + 999);

        if (error) {
            console.error(error);
            break;
        }
        if (!chunk || chunk.length === 0) break;
        allMovies = allMovies.concat(chunk);
        fetchOffset += 1000;
        process.stdout.write(`\rScanned ${allMovies.length} movies...`);
    }
    console.log(`\nScan complete.`);

    let count = 0;
    const actorIds = new Set<string>();
    const discrepancies: any[] = [];

    allMovies.forEach((m: any) => {
        if (m.data?.cast) {
            const srk = m.data.cast.find((c: any) => c.name.toLowerCase() === 'shah rukh khan');
            if (srk) {
                count++;
                actorIds.add(srk.id);
                // console.log(`- ${m.data.title} (ID: ${srk.id})`);
                if (actorIds.size > 1 && !discrepancies.length) {
                    // Just log first few discrepancies if found
                }
            }
        }
    });

    console.log(`\nTotal Movies found: ${count}`);
    console.log('Unique IDs used for Shah Rukh Khan:');
    actorIds.forEach(id => console.log(`   - ${id}`));

    if (actorIds.size === 1) {
        console.log('\n✅ ID Consistency: PERFECT. All movies use the same ID.');
    } else {
        console.log('\n⚠️  ID Consistency: MIXED. Multiple IDs found.');
    }
}

check();
