
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkExit8() {
    console.log("Searching for 'Exit 8'...");

    // 1. Search by title first roughly
    const { data: searchData, error: searchError } = await supabase
        .from('movies')
        .select('*')
        .ilike('data->>title', '%Exit 8%') // Search within JSONB
        // Also try standard column if exists (unlikely given previous pattern)
        .limit(1);

    if (searchData && searchData.length > 0) {
        console.log("✅ Found Exit 8!");
        const movie = searchData[0];
        const json = movie.data;

        console.log("--- RAW DB RECORD ---");
        console.log("ID:", movie.id);
        console.log("--- JSON DATA ('data' column) ---");
        // Print key fields
        console.log("Title:", json.title);
        console.log("Director:", json.director);
        console.log("Cast:", json.cast ? `Array(${json.cast.length})` : 'MISSING');
        console.log("Overview/Desc:", json.description?.substring(0, 50) + "...");

        // Check for common field name mismatches
        console.log("Directors (plural?):", json.directors);
        console.log("Directing (job?):", json.crew?.filter((c: any) => c.job === 'Director'));

    } else {
        console.log("❌ Could not find 'Exit 8' in Supabase via partial search.");
        console.log("Error:", searchError?.message);
    }
}

checkExit8();
