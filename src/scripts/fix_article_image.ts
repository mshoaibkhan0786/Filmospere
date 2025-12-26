
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    console.log('Fixing Article Image...');

    // 1. Find the movie "The Unhappiest Man in Town"
    const { data: movies, error: movieError } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%The Unhappiest Man in Town%')
        .limit(1);

    if (movieError || !movies || movies.length === 0) {
        console.error('Movie not found:', movieError);
        return;
    }

    const movie = movies[0].data; // Accessing the JSON column 'data'
    console.log('Found Movie:', movie.title);

    // 2. Determine best image (Backdrop > Poster)
    let imageUrl = '';
    if (movie.images && movie.images.length > 0) {
        console.log('Using first backdrop image.');
        imageUrl = movie.images[0];
    } else if (movie.posterUrl) {
        console.log('Using poster image.');
        imageUrl = movie.posterUrl;
    } else {
        console.error('No images found for movie.');
        return;
    }

    console.log('Selected Image URL:', imageUrl);

    // 3. Update the Article
    const articleSlug = 'hidden-gems-like-the-unhappiest-man-in-town';
    const { error: updateError } = await supabase
        .from('articles')
        .update({ image_url: imageUrl })
        .eq('slug', articleSlug);

    if (updateError) {
        console.error('Failed to update article:', updateError);
    } else {
        console.log('Successfully updated article image.');
    }
}

main();
