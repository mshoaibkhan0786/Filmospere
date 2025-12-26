
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
    console.log("Debugging Article Fetch with Join...");

    // Pick a known slug (from screenshot)
    const slug = "joker-s-final-laugh-the-true-meaning-behind-the-chaos";

    const { data, error } = await supabase
        .from('articles')
        .select('*, movie:movies(slug)')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

    if (error) {
        console.error("❌ Error fetching article:", error);
    } else if (!data) {
        console.error("❌ Article not found (Data is null).");
    } else {
        console.log("✅ Article Found:", data.title);
        console.log("Movie Slug:", data.movie?.slug || "NULL");
    }
}

main();
