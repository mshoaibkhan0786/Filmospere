
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
    console.log("Fetching Articles and their Links...");

    // Fetch all articles with their related movie ID
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, related_movie_id, is_published');

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (articles) {
        // Find the "Batman" / "Dark Knight" article
        const batman = articles.find(a => a.title.includes('Batman') || a.title.includes('Dark Knight'));
        const joker = articles.find(a => a.title.includes('Joker'));

        console.log("\n--- Analysis ---");
        if (batman) {
            console.log(`Title: "${batman.title}"`);
            console.log(`Related Movie ID: ${batman.related_movie_id}`);

            // Fetch the movie title for this ID
            if (batman.related_movie_id) {
                const { data: m } = await supabase.from('movies').select('title').eq('id', batman.related_movie_id).single();
                console.log(`Linked Movie: ${m?.title} (${batman.related_movie_id})`);
            }
        } else {
            console.log("Could not find 'Batman/Dark Knight' article.");
        }

        console.log("\nAll Articles:");
        articles.forEach(a => {
            console.log(`- [${a.related_movie_id}] ${a.title}`);
        });
    }
}

main();
