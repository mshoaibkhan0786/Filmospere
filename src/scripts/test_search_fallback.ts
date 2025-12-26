
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

async function main() {
    console.log("Testing Fallback Search Query...");
    const query = "Shutter Island";

    const startTime = Date.now();
    const { data, error, count } = await supabase
        .from('movies')
        .select('*', { count: 'exact' })
        .ilike('title', `%${query}%`)
        .order('data->voteCount', { ascending: false })
        .range(0, 9);

    const duration = Date.now() - startTime;

    if (error) {
        console.error("Fallback Query Error:", error);
    } else {
        console.log(`Success! Found ${count} results in ${duration}ms.`);
        if (data) {
            data.forEach(m => console.log(`- ${m.title} (ID: ${m.id})`));
        }
    }
}

main();
