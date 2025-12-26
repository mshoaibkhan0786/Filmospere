import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findMovie() {
    console.log('Searching Supabase for Shutter Island (ID: tmdb-11324)...');

    // Search by ID directly
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', 'tmdb-11324')
        .maybeSingle();

    if (error) {
        console.error('Supabase Error:', error);
        return;
    }

    if (movies) {
        const movie = movies.data; // Access the JSONB data column
        console.log('FOUND:', movie.title);
        console.log('FULL_RECORD:', JSON.stringify(movie, null, 2));

        // Check all possible image fields
        const backdrop = movie.backdropUrl || movie.backdrop_path;
        console.log('Backdrop relative path:', backdrop);

        if (backdrop) {
            const fullUrl = backdrop.startsWith('http') ? backdrop : `https://image.tmdb.org/t/p/original${backdrop}`;
            console.log('VALID_URL_FOR_SEED:', fullUrl);
        } else {
            console.log('NO_BACKDROP_FOUND');
        }
    } else {
        console.log('MOVIE_NOT_FOUND_BY_ID');
    }
}

findMovie();
