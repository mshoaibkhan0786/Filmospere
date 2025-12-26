
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    // 1. Get the movie first to find a backdrop
    const { data: movie } = await supabase
        .from('movies')
        .select('*')
        .eq('id', 'tmdb-737169')
        .single();

    let imageUrl = "https://image.tmdb.org/t/p/original/poDuNVrWoXDJOBrOXaeiScUIODl.jpg"; // User provided specifically

    // 2. Update the article
    const { error } = await supabase
        .from('articles')
        .update({ image_url: imageUrl })
        .eq('slug', 'hidden-gems-like-the-unhappiest-man-in-town');

    if (error) console.error('Error updating image:', error);
    else console.log('Successfully updated article image to:', imageUrl);
}

main();
