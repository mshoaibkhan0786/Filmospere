
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
    console.log("Debugging 'Joker' Article Assignment...");

    // 1. Find all articles mentioning "Joker" in title
    const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .ilike('title', '%Joker%');

    if (error) {
        console.error("Error fetching articles:", error);
        return;
    }

    if (!articles || articles.length === 0) {
        console.log("No articles found with 'Joker' in title.");
    } else {
        console.log(`Found ${articles.length} articles for 'Joker':`);
        for (const article of articles) {
            console.log(`\nArticle: "${article.title}"`);
            console.log(`  Linked to Movie ID: ${article.related_movie_id}`);

            // 2. Fetch the movie it is linked to
            if (article.related_movie_id) {
                const { data: movie } = await supabase
                    .from('movies')
                    .select('title, data') // Fetch data to get year
                    .or(`id.eq.${article.related_movie_id},slug.eq.${article.related_movie_id}`)
                    .maybeSingle(); // Use maybeSingle to avoid error if 0 rows

                if (movie) {
                    const releaseDate = movie.data.releaseDate || movie.data.release_date || 'Unknown';
                    const year = releaseDate.split('-')[0];
                    console.log(`  -> MOVIE FOUND: "${movie.title}" (${year})`);
                    console.log(`  -> Cast Snippet: ${movie.data.cast?.[0]?.name}`);

                    if (year === '2012') {
                        console.log("  ⚠️ ERROR: Linked to Bollywood 'Joker' (2012) instead of 2019!");
                    } else if (year === '2019') {
                        console.log("  ✅ Correctly linked to 'Joker' (2019).");
                    }
                } else {
                    console.log("  -> MOVIE NOT FOUND in DB!");
                }
            }
        }
    }
}

main();
