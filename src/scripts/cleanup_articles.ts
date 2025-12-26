
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
    console.log("Cleaning up ALL articles except 'Shutter Island'...");

    // 1. Fetch all articles
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title');

    if (error || !articles) {
        console.error("Error fetching articles:", error);
        return;
    }

    let deletedCount = 0;

    for (const article of articles) {
        // PROTECTION for Shutter Island
        if (article.title.toLowerCase().includes('shutter island')) {
            console.log(`🔒 Preserving: "${article.title}"`);
            continue;
        }

        console.log(`🗑️ Deleting: "${article.title}"`);
        const { error: deleteError } = await supabase
            .from('articles')
            .delete()
            .eq('id', article.id);

        if (deleteError) {
            console.error(`   Failed to delete: ${deleteError.message}`);
        } else {
            deletedCount++;
        }
    }

    console.log(`\n✅ Cleanup Complete. Deleted ${deletedCount} articles.`);
}

main();
