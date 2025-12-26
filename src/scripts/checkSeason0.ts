// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('Inspecting Doraemon Season 0...');

    const { data } = await supabase
        .from('movies')
        .select('data')
        .eq('id', 'tmdb-57911')
        .single();

    if (!data || !data.data.seasons) {
        console.log('No seasons found.');
        return;
    }

    const s0 = data.data.seasons.find((s: any) => s.seasonNumber === 0);
    if (s0) {
        console.log(`Season 0 Title: "${s0.title}"`);
        console.log(`Episode Count: ${s0.episodes.length}`);
        console.log('Sample Episodes:');
        s0.episodes.slice(0, 5).forEach((e: any) => console.log(`- ${e.title}`));
    } else {
        console.log('Season 0 not found in DB.');
    }
}

run();
