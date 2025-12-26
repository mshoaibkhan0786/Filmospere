
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
    console.log("Checking SEO Meta Tags for recent articles...");

    const { data: articles, error } = await supabase
        .from('articles')
        .select('title, meta_title, meta_description, keywords')
        .order('created_at', { ascending: false, nullsFirst: false }) // Get most recently updated
        .limit(5);

    if (error) {
        console.error("Error fetching articles:", error);
        return;
    }

    if (!articles || articles.length === 0) {
        console.log("No articles found.");
        return;
    }

    console.log(`Found ${articles.length} recently updated articles:\n`);

    articles.forEach(a => {
        console.log(`🎬 TITLE: ${a.title}`);
        console.log(`   META TITLE:       ${a.meta_title ? '✅ ' + a.meta_title : '❌ MISSING'}`);
        console.log(`   META DESC:        ${a.meta_description ? '✅ ' + a.meta_description : '❌ MISSING'}`);
        console.log(`   KEYWORDS:         ${a.keywords ? '✅ ' + a.keywords : '❌ MISSING'}`);
        console.log('---------------------------------------------------');
    });
}

main();
