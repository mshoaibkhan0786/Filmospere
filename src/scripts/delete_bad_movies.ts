
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use Service Role Key if available to ensure deletion permissions, else Anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// IDs of "Incorrect" / "Duplicate" movies to delete
const BAD_IDS = [
    'tmdb-1213076', // Fight Club (2023)
    'tmdb-391062',  // Joker (2016)
    'tmdb-129507',  // Joker (2012)
    'tmdb-48311',   // Parasite (1982)
    'tmdb-87516'    // Oldboy (2013)
];

async function main() {
    console.log("Deleting Duplicate Movies...");

    for (const id of BAD_IDS) {
        // First get title for logging
        const { data: m } = await supabase.from('movies').select('title').eq('id', id).single();
        const title = m ? m.title : 'Unknown';

        console.log(`🗑️ Deleting ${title} (${id})...`);

        const { error } = await supabase
            .from('movies')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`   ❌ Failed: ${error.message}`);
            // If failure is due to RLS, we might need SQL again, but usually 'movies' is deletable if key is powerful enough? 
            // Most RLS policies on 'movies' are aggressive.
        } else {
            console.log(`   ✅ Deleted.`);
        }
    }
}

main();
