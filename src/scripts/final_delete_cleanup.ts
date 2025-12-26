
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
    console.log("Performing Hard Delete of 'Soft Deleted' articles...");

    // 1. Fetch rows that are unpublished OR have [DELETED] in title
    const { data: trash, error } = await supabase
        .from('articles')
        .select('id, title')
        .or('is_published.eq.false,title.ilike.[DELETED]%');

    if (error) {
        console.error("Fetch failed:", error);
        return;
    }

    if (!trash || trash.length === 0) {
        console.log("No trash to delete.");
        return;
    }

    console.log(`Found ${trash.length} items to permanent delete.`);

    for (const item of trash) {
        console.log(`☠️ Hard Deleting: "${item.title}"`);
        const { error: delErr } = await supabase
            .from('articles')
            .delete()
            .eq('id', item.id);

        if (delErr) console.error("   ❌ Delete Failed:", delErr.message);
        else console.log("   ✅ Deleted.");
    }

    console.log("\nCleanup Complete.");
}

main();
