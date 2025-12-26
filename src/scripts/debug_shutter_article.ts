
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log("Searching for Shutter Island article...");

    const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .ilike('title', '%Shutter Island%');

    if (error) {
        console.error("Error fetching article:", error);
        return;
    }

    if (articles && articles.length > 0) {
        console.log(`Found ${articles.length} article(s):`);
        articles.forEach(a => {
            console.log(`- ID: ${a.id}`);
            console.log(`  Title: ${a.title}`);
            console.log(`  Slug: ${a.slug}`);
            console.log(`  Is Published: ${a.is_published}`);
            console.log(`  Created At: ${a.created_at}`);
        });
    } else {
        console.log("No article found with 'Shutter Island' in the title.");
    }
}

main();
