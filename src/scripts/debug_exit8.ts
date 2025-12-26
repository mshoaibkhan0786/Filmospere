
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkExit8() {
    console.log("Checking 'Exit 8' in Supabase...");

    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%Exit 8%');

    if (error) {
        console.error("Error fetching movie:", error);
        return;
    }

    if (!movies || movies.length === 0) {
        console.log("No movie found with title 'Exit 8'");
        return;
    }

    movies.forEach(m => {
        console.log(`\nID: ${m.id}`);
        console.log(`Title: ${m.title}`);
        console.log(`Optimized Flag: ${m.data.isOptimized}`);
        console.log(`Description: ${m.data.description}`);
        console.log(`WhyWatch: ${m.data.whyWatch ? JSON.stringify(m.data.whyWatch) : 'MISSING'}`);
        console.log(`Full Data Keys: ${Object.keys(m.data).join(', ')}`);
    });
}

checkExit8();
