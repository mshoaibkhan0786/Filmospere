
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Try to use Service Role Key if available, else Anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BAD_MOVIE_IDS = [
    'tmdb-129507', // Joker (Duplicate)
    'tmdb-391062', // Joker (Duplicate)
    'tmdb-87516',  // Oldboy (Duplicate)
    'tmdb-48311',  // Parasite (Duplicate)
    'tmdb-1213076' // Fight Club (Duplicate)
];

async function main() {
    console.log("Force Deleting articles for Bad Movie IDs...");

    // 1. Fetch exact IDs of articles to delete
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, related_movie_id')
        .in('related_movie_id', BAD_MOVIE_IDS);

    if (error) {
        console.error("Fetch Error:", error);
        return;
    }

    if (!articles || articles.length === 0) {
        console.log("No articles found for these bad IDs (Maybe already deleted?).");
        return;
    }

    console.log(`Found ${articles.length} articles to delete.`);

    for (const a of articles) {
        console.log(`🗑️ Deleting "${a.title}" (Movie: ${a.related_movie_id})...`);
        const { error: delErr, count } = await supabase
            .from('articles')
            .delete({ count: 'exact' }) // Request count of deleted rows
            .eq('id', a.id);

        if (delErr) {
            console.error(`   ❌ FAIL: ${delErr.message} (Code: ${delErr.code})`);
        } else {
            console.log(`   ✅ Success? Response: `, count !== null ? `Deleted ${count} rows` : "No count returned");
        }
    }
}

main();
