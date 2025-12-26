
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

async function checkDoraemon() {
    console.log('Searching for Doraemon in DB...');
    const { data, error } = await supabase
        .from('movies')
        .select('id, title')
        .ilike('title', '%Doraemon%')
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Found matches:', data);
    } else {
        console.log('No "Doraemon" found in DB via ilike.');
    }
}

checkDoraemon().catch(console.error);
