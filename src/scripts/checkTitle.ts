
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkTitle() {
    const { data, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .eq('id', 'tmdb-185008')
        .single();

    if (error) console.error(error);
    else {
        console.log('ID:', data.id);
        console.log('Title Column:', data.title);
        console.log('Data.Title:', data.data?.title);
    }
}

checkTitle();
