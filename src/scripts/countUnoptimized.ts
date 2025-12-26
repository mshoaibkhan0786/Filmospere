import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Env Vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function count() {
    console.log('Counting movies...');
    // We have to scan because isOptimized is inside JSONB
    let from = 0;
    const batchSize = 1000;
    let more = true;
    let total = 0;
    let unoptimized = 0;

    while (more) {
        const { data, error } = await supabase
            .from('movies')
            .select('data')
            .range(from, from + batchSize - 1);

        if (data && data.length > 0) {
            total += data.length;
            data.forEach(row => {
                // Check if optimized
                const m = row.data;
                if (!m.isOptimized) {
                    // Also check if manual content exists (our new skip logic)
                    if (!(m.whyWatch && m.whyWatch.length > 0 && m.metaDescription)) {
                        unoptimized++;
                    }
                }
            });
            from += batchSize;
        } else {
            more = false;
        }
    }

    console.log(`\nTotal Movies: ${total}`);
    console.log(`Unoptimized (Remaining): ${unoptimized}`);
}

count();
