
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    const { data: movie } = await supabase
        .from('movies')
        .select('*')
        .eq('id', 'tmdb-737169')
        .single();

    if (movie) {
        console.log('Valid Poster:', movie.posterUrl);
        // Also check if data.poster_path exists
        if (movie.data?.poster_path) {
            console.log('TMDB Poster Path:', movie.data.poster_path);
        }
    }
}

main();
