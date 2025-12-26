
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // STRICTLY ANON

console.log("Using Anon Key:", supabaseKey ? "Yes" : "No");
if (!supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    console.log("Fetching articles with Select * as Anon...");

    const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!articles || articles.length === 0) {
        console.log("No articles found.");
        return;
    }

    const article = articles[0];
    console.log(`Title: ${article.title}`);
    console.log(`Content Type: ${typeof article.content}`);
    console.log(`Content Length: ${article.content ? article.content.length : 'N/A'}`);

    if (article.content) {
        console.log(`Snippet: ${article.content.substring(0, 50)}...`);
    } else {
        console.log("CONTENT IS MISSING/NULL!");
    }
}

main();
