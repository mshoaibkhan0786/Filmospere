
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

const BAD_MOVIE_IDS = [
    'tmdb-129507', 'tmdb-391062', 'tmdb-87516', 'tmdb-48311', 'tmdb-1213076'
];

async function main() {
    console.log("Soft-Deleting (hiding) incorrect articles...");

    const { data: articles } = await supabase
        .from('articles')
        .select('id, title')
        .in('related_movie_id', BAD_MOVIE_IDS);

    if (articles && articles.length > 0) {
        for (const a of articles) {
            console.log(`Resource: "${a.title}" -> Unpublishing...`);

            const { error } = await supabase
                .from('articles')
                .update({
                    is_published: false,
                    title: `[DELETED] ${a.title}`
                })
                .eq('id', a.id);

            if (error) console.error("   Failed:", error.message);
            else console.log("   ✅ Hidden successfully.");
        }
    } else {
        console.log("No bad articles found.");
    }
}

main();
