// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('--- Assessing Database State ---');

    // 1. Check Total Movies
    const { count: total, error: err1 } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true });

    // 2. Check Movies with SEO (whyWatch)
    // Note: We can't easily query JSON length in all dialects, but we can check if the key exists and is not null/empty array
    // Since optimization adds 'whyWatch', we check for its presence.
    // Using a raw filter for JSONB check if possible, or just fetching a sample.
    // Supabase JS filter for JSON array length > 0 is tricky without RPC, 
    // but check for not-null 'whyWatch' in data column.

    // We'll fetch a sample of 100 recent updates or randoms and see stats
    const { data: sample, error: err2 } = await supabase
        .from('movies')
        .select('title, data')
        .limit(200);

    if (err1 || err2) {
        console.error('Error fetching:', err1 || err2);
        return;
    }

    let seoCount = 0;
    let streamingCount = 0;
    let rentBuyCount = 0;
    let seasonCount = 0;

    sample.forEach(row => {
        const m = row.data;
        if (m.whyWatch && m.whyWatch.length > 0) seoCount++;
        if (m.streamingLinks && m.streamingLinks.length > 0) {
            streamingCount++;
            // Check for deeper streaming data (rent/buy) which was part of recent updates
            const hasRentBuy = m.streamingLinks.some(l => l.url && (l.url.includes('apple') || l.url.includes('amazon') || l.url.includes('google')));
            if (hasRentBuy) rentBuyCount++;
        }
        if (m.seasons && m.seasons.length > 0) seasonCount++;
    });

    console.log(`Total Movies in DB: ${total}`);
    console.log(`\n--- Sample Analysis (N=200) ---`);
    console.log(`Movies with SEO (whyWatch): ${seoCount} / 200 (${(seoCount / 2)}%)`);
    console.log(`Movies with Streaming Links: ${streamingCount} / 200 (${(streamingCount / 2)}%)`);
    console.log(`Movies with Rent/Buy Links (Recent Update): ${rentBuyCount} / 200`);

    // Check specific known entities
    const knownParams = ['Money Heist', 'Doraemon'];
    for (const title of knownParams) {
        const { data: specific } = await supabase
            .from('movies')
            .select('data')
            .ilike('title', `%${title}%`)
            .limit(1);

        if (specific && specific.length > 0) {
            const m = specific[0].data;
            console.log(`\nStatus of "${m.title}":`);
            console.log(`- whyWatch: ${m.whyWatch ? 'YES (' + m.whyWatch.length + ' points)' : 'NO'}`);
            console.log(`- Streaming: ${m.streamingLinks ? 'YES (' + m.streamingLinks.length + ' links)' : 'NO'}`);
            console.log(`- Seasons: ${m.seasons ? 'YES (' + m.seasons.length + ')' : 'NO'}`);
        }
    }
}

run();
