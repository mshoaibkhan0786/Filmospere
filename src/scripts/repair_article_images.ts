
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Repairing Article Images (Using images[0] or posterUrl)...");

    // 1. Fetch articles with MISSING images
    const { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, related_movie_id, image_url')
        .is('image_url', null);

    if (fetchError) {
        console.error("Fetch Error:", fetchError);
        return;
    }

    console.log(`Found ${articles.length} articles needing repair.`);

    if (articles.length === 0) return;

    let successCount = 0;

    for (const article of articles) {
        if (!article.related_movie_id) {
            console.log(`Skipping: ${article.title} (No related Movie ID)`);
            continue;
        }

        // 2. Fetch the Movie Data
        const { data: movie, error: movieError } = await supabase
            .from('movies')
            .select('data')
            .eq('id', article.related_movie_id)
            .single();

        if (movieError || !movie || !movie.data) {
            console.warn(`Could not find movie data for: ${article.title} (ID: ${article.related_movie_id})`);
            continue;
        }

        // 3. Determine Image URL
        // array of backdrops is in movie.data.images
        let imageUrl = null;

        if (Array.isArray(movie.data.images) && movie.data.images.length > 0) {
            imageUrl = movie.data.images[0]; // First backdrop
        } else if (movie.data.posterUrl) {
            imageUrl = movie.data.posterUrl; // Fallback to poster
        }

        if (!imageUrl) {
            console.warn(`No images found for: ${article.title}`);
            continue;
        }

        // 4. Update the Article
        const { error: updateError } = await supabase
            .from('articles')
            .update({ image_url: imageUrl })
            .eq('id', article.id);

        if (updateError) {
            console.error(`Failed to update article ${article.title}:`, updateError);
        } else {
            console.log(`✅ Repaired: ${article.title.substring(0, 30)}...`);
            successCount++;
        }
    }

    console.log(`\nSuccessfully repaired images for ${successCount} articles.`);
}

main();
