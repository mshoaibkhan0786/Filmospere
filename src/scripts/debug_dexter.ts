
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const target = process.argv[2] || "Dexter: Resurrection";

async function checkMovie() {
    console.log(`Checking for '${target}'...`);

    const { data: movies, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .ilike('title', `%${target}%`)
        .limit(5);

    if (movies && movies.length > 0) {
        movies.forEach(m => {
            console.log(`\nID: ${m.id}`);
            console.log(`Title: ${m.title}`);
            console.log(`TMDB ID: ${m.data.tmdb_id || 'N/A'}`);
            console.log(`Cast (First 3):`, m.data.cast?.slice(0, 3).map((c: any) => `${c.name} as ${c.role}`));
        });
    } else {
        console.log("No movies found.");
    }
}

checkMovie();
