
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY!);

async function check() {
    console.log('🔍 Checking Discrepancy Range 3000-4000...');

    let count = 0;
    let scanned = 0;

    // Fetch in chunks of 200
    for (let offset = 3000; offset < 4000; offset += 200) {
        const { data: movies } = await supabase
            .from('movies')
            .select('id, data')
            .range(offset, offset + 199);

        if (!movies) continue;

        movies.forEach(m => {
            scanned++;
            const cast = m.data?.cast || [];
            if (cast.some((c: any) => c.id?.startsWith?.('aaa-person-'))) {
                count++;
            }
        });
        process.stdout.write(`\rScanned: ${scanned} | Found Bad: ${count}`);
    }

    console.log(`\nFinal Bad Count in 3000-4000: ${count}`);
}

check();
