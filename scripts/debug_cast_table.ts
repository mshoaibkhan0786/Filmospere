import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('🕵️‍♀️ Inspecting CAST table...');

    // 1. Total Count
    const { count: total, error: err1 } = await supabase.from('cast').select('*', { count: 'exact', head: true });
    console.log(`\nTOTAL Rows: ${total}`);

    // 2. Count with Biography
    // We can't easily count not-null with select params efficiently if large, but let's try getting a sample.
    const { data: sample, error: err2 } = await supabase
        .from('cast')
        .select('name, biography, updated_at')
        .limit(20)
        .order('updated_at', { ascending: false }); // Get absolute latest

    console.log('\n--- LATEST 20 UPDATES ---');
    sample?.forEach(r => {
        const bioLen = r.biography ? r.biography.length : 0;
        const bioSnippet = r.biography ? r.biography.substring(0, 50) + '...' : 'NULL';
        console.log(`[${r.updated_at}] ${r.name} (Bio Len: ${bioLen}): ${bioSnippet}`);
    });

    // 3. Count Updated Today (Approx)
    // Assuming script ran today. 
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount, error: err3 } = await supabase
        .from('cast')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', today);

    console.log(`\n📅 Updated TODAY: ${todayCount}`);

    // Check if there are rows with NULL bio?
    const { count: nullBio, error: err4 } = await supabase
        .from('cast')
        .select('*', { count: 'exact', head: true })
        .is('biography', null);

    console.log(`🚫 Rows with NULL Bio: ${nullBio}`);
}

run();
