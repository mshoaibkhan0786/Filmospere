
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Debugging Movie Data for ID: tmdb-155 (The Dark Knight)...");

    const { data: movie, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', 'tmdb-155')
        .single();

    if (error) {
        console.error("Fetch Error:", error);
        return;
    }

    if (!movie) {
        console.log("Movie NOT Found.");
        return;
    }

    console.log("Movie Found:", movie.title);
    if (movie.data) {
        console.log("Data Column Keys:", Object.keys(movie.data));
        console.log("Backdrop Path:", movie.data.backdrop_path);
        console.log("Poster Path:", movie.data.poster_path);
        console.log("Title data:", movie.data.title);
    } else {
        console.log("Data column is NULL or EMPTY.");
    }
}

main();
