
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    console.log("Fetching Hidden Gems Article...");
    const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .ilike('title', '%Hidden%');

    if (!articles || articles.length === 0) {
        console.log("Article not found.");
        return;
    }

    const article = articles[0];
    console.log(`Title: ${article.title}`);
    console.log(`Writing content to article_dump.txt...`);

    fs.writeFileSync('article_dump.txt', article.content);
    console.log("Done.");
}

main();
