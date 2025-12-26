 // @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('Checking for updated movies...');

    // Fetch a batch to check
    const { data: movies, error } = await supabase
        .from('movies')
        .select('data')
        .limit(200); // Check first 200

    if (error) {
        console.error(error);
        return;
    }

    const updated = movies
        .map(row => row.data)
        .filter(m => m.streamingLinks && m.streamingLinks.length > 0)
        .slice(0, 5);

    if (updated.length === 0) {
        console.log('No updated movies found yet in the first 200.');
    } else {
        console.log('\n--- VERIFIED UPDATED MOVIES ---');
        updated.forEach(m => {
            console.log(`✅ ${m.title}`);
            console.log(`   - Regions: ${[...new Set(m.streamingLinks.map(l => l.country))].join(', ')}`);
            console.log(`   - Links: ${m.streamingLinks.length}`);
        });
    }
}

run();
