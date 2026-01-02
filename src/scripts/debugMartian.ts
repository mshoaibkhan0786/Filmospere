
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const MOVIE_ID = 'tmdb-286217'; // The Martian

async function check() {
    console.log(`Checking Supabase data for ${MOVIE_ID}...`);

    const { data: movie, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', MOVIE_ID)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (movie) {
        console.log('Title:', movie.data.title);
        console.log('Release Year (Raw):', movie.data.releaseYear);
        console.log('Release Year type:', typeof movie.data.releaseYear);
    } else {
        console.log('Movie not found');
    }
}

check();
