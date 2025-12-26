
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkRestore() {
    // Check "Green Book" specifically
    const { data: movies } = await supabase.from('movies').select('*').ilike('title', 'Green Book').limit(1);
    if (movies && movies.length > 0) {
        const m = movies[0];
        console.log(`\nGreen Book Status: isOptimized=${m.data.isOptimized}`);
        console.log(`Meta Desc: ${m.data.metaDescription ? '✅ Present' : '❌ Missing'}`);
    }

    // Check Total Optimized Count
    const { count, error } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true }) // head:true means don't fetch data, just count
        .eq('data->>isOptimized', 'true'); // JSONB query

    if (error) console.error("Count Error:", error);
    else console.log(`\nTotal Optimized Movies in DB: ${count}`);
}

checkRestore();
