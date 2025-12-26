
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkSchemaFixed() {
    console.log("Checking 5 random optimized movies...");

    // Fetch movies that are marked as optimized
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .not('data->>seoDescription', 'is', 'null') // Ensure it HAS a seoDescription to check
        .limit(5);

    if (error) {
        console.error("Error fetching:", error);
        return;
    }

    if (!movies || movies.length === 0) {
        console.log("No optimized movies found.");
        return;
    }

    movies.forEach(m => {
        const d = m.data;
        console.log(`\n--- ${m.title} ---`);
        console.log(`[description] (${d.description?.length || 0} chars):\n   ${d.description?.substring(0, 100).replace(/\n/g, ' ')}...`);
        console.log(`[seoDescription] (${d.seoDescription?.length || 0} chars):\n   ${d.seoDescription?.substring(0, 100).replace(/\n/g, ' ')}...`);
    });
}

checkSchemaFixed();
