
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function showExit8() {
    console.log("Fetching FULL data for Exit 8 (tmdb-1408208)...");

    const { data: movie, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', 'tmdb-1408208')
        .single();

    if (error) {
        console.error("❌ Error fetching:", error.message);
        return;
    }

    if (!movie) {
        console.error("❌ Movie not found.");
        return;
    }

    // Pretty print the JSON structure
    console.log("SLUG:", movie.data.slug);
    console.log(JSON.stringify(movie.data, null, 2));
}

showExit8();
