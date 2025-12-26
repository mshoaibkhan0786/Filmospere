
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
    console.log("Cleaning up incorrect Joker articles...");

    const badIds = [
        'tmdb-129507', // Joker (2012) - Linked to Arthur Fleck article
        'tmdb-391062'  // Killing of a Sacred Deer - Linked to Arthur Fleck article
    ];

    for (const id of badIds) {
        // Double check title before deleting to be safe
        const { data: articles } = await supabase
            .from('articles')
            .select('*')
            .eq('related_movie_id', id)
            .ilike('title', '%Joker%'); // Only delete if it's actually a Joker article

        if (articles && articles.length > 0) {
            console.log(`Found ${articles.length} bad articles for ID ${id}:`);
            for (const a of articles) {
                console.log(` - Deleting: "${a.title}"`);
                const { error } = await supabase.from('articles').delete().eq('id', a.id);
                if (error) console.error("   Failed to delete:", error);
                else console.log("   ✅ Deleted.");
            }
        } else {
            console.log(`No incorrectly mapped Joker articles found for ID ${id}.`);
        }
    }
}

main();
