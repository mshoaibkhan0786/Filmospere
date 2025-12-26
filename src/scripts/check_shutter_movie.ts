
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log("Checking Shutter Island movie...");

    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%Shutter Island%');

    if (movies) {
        movies.forEach(m => {
            console.log(`Title: ${m.title}`);
            console.log(`ID: ${m.id}`);
            console.log(`Slug: ${m.slug}`);
        });
    } else {
        console.error("Error:", error);
    }
}

main();
