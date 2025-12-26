
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkKaminey2025() {
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('data->>title', '%kaminey%');

    if (error) {
        console.error('Error fetching movie:', error);
        return;
    }

    if (!movies || movies.length === 0) {
        console.log('No movies found');
        return;
    }

    console.log(`Found ${movies.length} movies matching 'kaminey':`);
    movies.forEach(m => {
        const d = m.data;
        console.log('--------------------------------------------------');
        console.log(`ID: ${m.id}`);
        console.log(`Title: ${d.title}`);
        console.log(`Release Date: ${d.releaseDate}`);
        console.log(`Adult: ${d.adult}`);
        console.log(`Poster: ${d.posterUrl}`);
        console.log(`Images: ${JSON.stringify(d.images?.length || 0)}`);
        console.log(`Overview: ${d.overview ? d.overview.substring(0, 100) + '...' : 'N/A'}`);
        console.log(`Genres: ${JSON.stringify(d.genres)}`);
        console.log('--------------------------------------------------');
    });
}

checkKaminey2025();
