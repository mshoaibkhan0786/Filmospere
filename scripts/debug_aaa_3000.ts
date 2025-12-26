
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
    console.log('🔍 Debugging range 3000-4000...');

    // Fetch range 3000-3200
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .range(3000, 3199);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Fetched ${movies?.length} movies.`);

    let count = 0;
    movies?.forEach(m => {
        const cast = m.data?.cast || [];
        const bad = cast.filter((c: any) => c.id?.startsWith?.('aaa-person-'));
        if (bad.length > 0) {
            count++;
            if (count <= 3) {
                console.log(`FOUND BAD ID in "${m.data.title}" (ID: ${m.id}):`);
                console.log(`   - ${bad[0].id} (${bad[0].name})`);
            }
        }
    });

    console.log(`Total bad in this batch: ${count}`);
}

check();
