
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkJawan() {
    const { data, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .ilike('title', '%Jawan%') // Search for Jawan
        .limit(1)
        .single();

    if (error) {
        console.error(error);
    } else {
        console.log('Movie:', data.title);
        console.log('Why Watch:', data.data.whyWatch);
    }
}

checkJawan();
