
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
    console.log("Checking Joker (tmdb-475557) Slug...");

    const { data: movie, error } = await supabase
        .from('movies')
        .select('id, title, slug')
        .eq('id', 'tmdb-475557')
        .single();

    if (error) {
        console.error("Fetch Error:", error);
    } else {
        console.log("Movie Found:");
        console.log(`ID: ${movie.id}`);
        console.log(`Title: ${movie.title}`);
        console.log(`Slug: ${movie.slug || "NULL"}`);
    }
}

main();
