
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Ensure we use the Service Key for any potential deletes later
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '');

async function main() {
    console.log("🔍 Verifying Shutter Island State...\n");

    // 1. Check Original
    const { data: original, error: _err1 } = await supabase
        .from('articles')
        .select('id, title, slug')
        .eq('slug', 'shutter-island-ending-explained')
        .maybeSingle();

    if (original) console.log(`✅ ORIGINAL EXISTS:\n   ID: ${original.id}\n   Title: ${original.title}\n`);
    else console.log(`❌ ORIGINAL MISSING (Slug: shutter-island-ending-explained)\n`);

    // 2. Check AI Duplicate
    const { data: ai, error: _err2 } = await supabase
        .from('articles')
        .select('id, title, slug')
        .eq('slug', 'the-lighthouse-dilemma-unpacking-shutter-island-s-ending')
        .maybeSingle();

    if (ai) console.log(`⚠️  AI DUPLICATE EXISTS:\n   ID: ${ai.id}\n   Title: ${ai.title}\n`);
    else console.log(`✅ AI DUPLICATE GONE (Slug: the-lighthouse-dilemma-unpacking-shutter-island-s-ending)\n`);

    // Automatic Fix if needed
    if (ai) {
        console.log("🛠️  Attempting to delete AI Duplicate...");
        const { error: delErr } = await supabase.from('articles').delete().eq('id', ai.id);
        if (delErr) console.error("   Delete Failed:", delErr);
        else console.log("   Delete Sent (Verify if successful).");
    }

    if (!original) {
        console.log("🛠️  Attempting to seed Original...");
        // Call seed logic here directly if needed, but for now just report.
        console.log("   Please run seed_shutter_island.ts again.");
    }
}

main();
