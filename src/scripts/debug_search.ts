
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
    console.log("Debugging Search Query...");
    const startTime = Date.now();

    // Standard Supabase ILIKE search (replicating typical frontend)
    const { data, error } = await supabase
        .from('movies')
        .select('id, title')
        .ilike('title', '%joker%'); // "contains" joker

    const duration = Date.now() - startTime;

    if (error) {
        console.error("❌ Search Failed:");
        console.error("   Code:", error.code);
        console.error("   Message:", error.message); // Should contain timeout details if 500
    } else {
        console.log(`✅ Search Success in ${duration}ms!`);
        console.log(`   Found ${data?.length} results.`);
    }
}

main();
