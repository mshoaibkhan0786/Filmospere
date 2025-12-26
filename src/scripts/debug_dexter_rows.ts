
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function debugDexterRows() {
    console.log("Querying all 'Dexter' rows...");

    const { data: movies, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .ilike('title', '%Dexter: Resurrection%');

    if (movies && movies.length > 0) {
        movies.forEach(m => {
            console.log(`\n--------------------------------------------------`);
            console.log(`Row ID: ${m.id}`);
            console.log(`Title: ${m.title}`);
            console.log(`TMDB ID in Data: ${m.data.tmdb_id}`);
            console.log(`Language: ${m.data.language}`);
            console.log(`Status: ${m.data.status}`);
            console.log(`First Cast: ${m.data.cast?.[0]?.name}`);
            console.log(`Cast Length: ${m.data.cast?.length}`);
            console.log(`Poster: ${m.data.posterUrl}`);
        });
    } else {
        console.log("No movies found matching 'Dexter: Resurrection'.");
    }
}

debugDexterRows();
