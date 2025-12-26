
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log("🔍 Checking for 'The Final Choice' (Original Article)...");

    // Check for the original
    const { data: original } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', 'shutter-island-ending-explained')
        .maybeSingle();

    if (original) {
        console.log(`✅ FOUND ORIGINAL: "${original.title}" (ID: ${original.id})`);
    } else {
        console.log("❌ Original NOT FOUND. Something went wrong with the seed.");
    }

    // Delete the AI duplicate
    console.log("\n🗑️  Deleting AI Duplicate ('The Lighthouse Dilemma')...");
    const { error, count } = await supabase
        .from('articles')
        .delete({ count: 'exact' })
        .eq('slug', 'the-lighthouse-dilemma-unpacking-shutter-island-s-ending');

    if (error) {
        console.error("Delete failed:", error);
    } else {
        console.log(`✅ Delete command executed.`);
        // Note: count might not be returned depending on headers, but we tried.

        // Verify it's gone
        const { data: check } = await supabase
            .from('articles')
            .select('id')
            .eq('slug', 'the-lighthouse-dilemma-unpacking-shutter-island-s-ending')
            .maybeSingle();

        if (!check) console.log("✅ Verified: AI duplicate is GONE.");
        else console.log("⚠️  Warning: AI duplicate STILL EXISTS.");
    }
}

main();
