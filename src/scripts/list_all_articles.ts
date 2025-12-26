
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
    console.log("Fetching all articles...");

    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, related_movie_id, created_at');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`\nTotal Articles: ${articles?.length}`);

    // Group by Related Movie ID
    const byMovie: Record<string, string[]> = {};
    articles?.forEach(a => {
        const key = a.related_movie_id || 'unlinked';
        if (!byMovie[key]) byMovie[key] = [];
        byMovie[key].push(a.title);
    });

    Object.entries(byMovie).forEach(([movieId, titles]) => {
        console.log(`\nMovie ID: ${movieId}`);
        titles.forEach(t => console.log(`  - ${t}`));
        if (titles.length > 1) console.log("  ⚠️  DUPLICATE ARTICLES FOR THIS ID!");
    });
}

main();
