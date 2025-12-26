
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use Anon to simulate browser

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    console.log("Checking Shutter Island article linkage...");

    // 1. Find Shutter Island Movie ID
    const { data: movies } = await supabase
        .from('movies')
        .select('id, data')
        .filter('data->>title', 'ilike', 'Shutter Island')
        .limit(1);

    if (!movies || movies.length === 0) {
        console.log("Shutter Island movie not found.");
        return;
    }
    const movie = movies[0];
    console.log(`Movie Found: ${movie.data.title} (ID: ${movie.id})`);

    // 2. Find Article directly linked to this ID
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, related_movie_id')
        .eq('related_movie_id', movie.id);

    if (error) {
        console.error("Error fetching articles:", error);
    } else {
        console.log(`Directly Linked Articles: ${articles.length}`);
        articles.forEach(a => console.log(` - "${a.title}"`));
    }
}

main();
