
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
    console.log("Debugging Movie IMAGES for ID: tmdb-155...");

    const { data: movie } = await supabase
        .from('movies')
        .select('*')
        .eq('id', 'tmdb-155')
        .single();

    if (movie && movie.data) {
        console.log("PosterURL:", movie.data.posterUrl);
        console.log("Images Object:", JSON.stringify(movie.data.images, null, 2));
    }
}

main();
