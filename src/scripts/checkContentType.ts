// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    const targets = [
        { id: 'tmdb-57911', name: 'Doraemon' },
        { id: 'tmdb-71446', name: 'Money Heist' }
    ];

    for (const t of targets) {
        const { data } = await supabase
            .from('movies')
            .select('data')
            .eq('id', t.id)
            .single();

        if (data) {
            console.log(`\n${t.name} (${t.id}):`);
            console.log(`- ContentType: '${data.data.contentType}'`);
            console.log(`- Total Seasons (Field): ${data.data.totalSeasons}`);
            console.log(`- Seasons Array Length: ${data.data.seasons?.length}`);
            if (data.data.seasons?.length > 0) {
                console.log(`- First Season Episodes: ${data.data.seasons[0].episodes?.length}`);
            }
        } else {
            console.log(`\n${t.name}: Record NOT FOUND`);
        }
    }
}

run();
