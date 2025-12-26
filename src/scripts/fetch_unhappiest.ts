
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%Unhappiest Man in Town%')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('MOVIE_DATA:', JSON.stringify({
            id: data.id,
            title: data.title,
            slug: data.data.slug || data.id,
            posterUrl: data.posterUrl,
            year: data.data.releaseYear,
            desc: data.data.description
        }, null, 2));
    }
}

main();
