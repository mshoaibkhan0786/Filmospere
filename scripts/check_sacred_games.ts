
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSacredGames() {
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%Sacred Games%');

    if (error) {
        console.error('Error fetching movie:', error);
        return;
    }

    if (!movies || movies.length === 0) {
        console.log('No movie found with title "Sacred Games"');
        return;
    }

    console.log(`Found ${movies.length} matches:`);
    movies.forEach(m => {
        console.log('------------------------------------------------');
        console.log(`ID: ${m.id}`);
        console.log(`Title: ${m.title}`);
        console.log(`TMDB ID: ${JSON.stringify(m.data.id || m.data.tmdbId)}`);
        console.log(`Language (Root): ${m.language}`);
        console.log(`Languages (Array):`, m.data.languages || m.languages);
        console.log(`Original Language:`, m.data.originalLanguage || m.originalLanguage);
    });
}

checkSacredGames();
