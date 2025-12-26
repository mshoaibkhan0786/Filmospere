
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fetching 'The Matrix' article to verify formatting...");

    const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .ilike('title', '%Matrix%')
        .maybeSingle();

    if (error) {
        console.error("Error fetching article:", error);
        return;
    }

    if (!article) {
        console.error("Article not found!");
        return;
    }

    console.log(`\n--- TITLE: ${article.title} ---`);
    console.log(`--- EXCERPT: ${article.excerpt} ---`);
    console.log(`--- LENGTH: ${article.content.length} chars ---\n`);

    // Check for specific formatting markers
    const hasBlockquote = article.content.includes('> ');
    const hasH2 = article.content.includes('## ');
    const hasBullets = article.content.includes('* ') || article.content.includes('- ');

    console.log("Formatting Check:");
    console.log(`- Blockquotes (>): ${hasBlockquote ? '✅ YES' : '❌ NO'}`);
    console.log(`- H2 Headers (##): ${hasH2 ? '✅ YES' : '❌ NO'}`);
    console.log(`- Bullet Points (*Or-): ${hasBullets ? '✅ YES' : '❌ NO'}`);

    console.log("\n--- CONTENT SNIPPET ---");
    console.log(article.content.substring(0, 500) + "...\n");
}

main();
