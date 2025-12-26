
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function debugDexterFull() {
    console.log("Querying FULL Dexter data...");

    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%Dexter: Resurrection%');

    if (movies && movies.length > 0) {
        movies.forEach(m => {
            console.log(`\nID: ${m.id}`);
            console.log(`Title: ${m.title}`);
            console.log(`Data.Language: '${m.data.language}'`);
            console.log(`Data.Languages (Array):`, m.data.languages);
            console.log(`Data.PosterUrl: '${m.data.posterUrl}'`);
            console.log(`Data.Status: '${m.data.status}'`);
            console.log(`Data.Seasons:`, JSON.stringify(m.data.seasons, null, 2));
            console.log(`Data.Duration: '${m.data.duration}'`);
        });
    } else {
        console.log("No movies found.");
    }
}

debugDexterFull();
