
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkStats() {
    console.log('Checking DB Stats...');

    // 1. Total Count
    const { count, error: countError } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true });

    console.log(`Total Movies: ${count} (Error: ${countError?.message})`);

    // 2. Check Doraemon Rank
    const { data: doraemon, error: dError } = await supabase
        .from('movies')
        .select('id, title, data')
        .ilike('title', '%Doraemon%')
        .limit(1);

    if (doraemon && doraemon.length > 0) {
        const d = doraemon[0];
        console.log(`Doraemon Found: ${d.title}`);
        console.log(` - Vote Count: ${d.data.voteCount}`);
        console.log(` - Release Year: ${d.data.releaseYear}`);
    } else {
        console.log('Doraemon not found via ilike.');
    }
}

checkStats().catch(console.error);
