
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
    console.log("Checking for duplicate articles per movie...");

    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, related_movie_id');

    if (error || !articles) {
        console.error("Error:", error);
        return;
    }

    const counts: Record<string, { count: number, titles: string[] }> = {};

    articles.forEach(a => {
        const key = a.related_movie_id;
        if (!key) return;

        if (!counts[key]) counts[key] = { count: 0, titles: [] };
        counts[key].count++;
        counts[key].titles.push(a.title);
    });

    let foundIssue = false;
    Object.entries(counts).forEach(([movieId, data]) => {
        if (data.count > 1) {
            console.log(`\n⚠️ Movie ID '${movieId}' has ${data.count} articles:`);
            data.titles.forEach(t => console.log(`   - ${t}`));
            foundIssue = true;
        }
    });

    if (!foundIssue) {
        console.log("\n✅ No movies have more than 1 article.");
    } else {
        console.log("\nFound duplicate coverage.");
    }
}

main();
