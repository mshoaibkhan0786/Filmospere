
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

// IDs of "Incorrect" / "Duplicate" movies we don't want articles for
const BAD_IDS = [
    'tmdb-1213076', // Fight Club (2023)
    'tmdb-391062',  // Joker (2016)
    'tmdb-129507',  // Joker (2012)
    'tmdb-48311',   // Parasite (1982)
    'tmdb-87516'    // Oldboy (2013)
];

async function main() {
    console.log("Removing articles attached to incorrect movie versions...");

    let deletedCount = 0;

    for (const id of BAD_IDS) {
        const { data: articles, error } = await supabase
            .from('articles')
            .select('*')
            .eq('related_movie_id', id);

        if (articles && articles.length > 0) {
            for (const a of articles) {
                console.log(`🗑️ Deleting article: "${a.title}" (Linked to ${id})`);
                const { error: delErr } = await supabase.from('articles').delete().eq('id', a.id);
                if (delErr) console.error("   Error:", delErr);
                else deletedCount++;
            }
        }
    }

    console.log(`\n✅ Cleaned up ${deletedCount} articles.`);
}

main();
