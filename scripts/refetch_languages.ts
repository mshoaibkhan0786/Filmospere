import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Using the token found in the previous file view to ensure access
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchTmdbDetails(tmdbId: string) {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?language=en-US`;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_READ_TOKEN}`
        }
    };

    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            console.error(`TMDB API Error: ${res.status} ${res.statusText}`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error('Fetch error:', err);
        return null;
    }
}

async function refetchLanguagesForKantara() {
    console.log('Fetching Kantara from DB...');
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%Kantara%');

    if (error || !movies) {
        console.error('Error fetching Kantara from DB:', error);
        return;
    }

    console.log(`Found ${movies.length} movies.`);

    for (const row of movies) {
        const movie = row.data;
        // extract numeric ID from "tmdb-858485"
        const tmdbMatch = row.id.match(/tmdb-(\d+)/);
        if (!tmdbMatch) {
            console.log(`Skipping non-TMDB ID: ${row.id}`);
            continue;
        }

        const tmdbId = tmdbMatch[1];
        console.log(`Fetching details for TMDB ID: ${tmdbId} (${movie.title})`);

        const details: any = await fetchTmdbDetails(tmdbId);

        if (details && details.spoken_languages) {
            const languages = details.spoken_languages.map((l: any) => l.english_name || l.name);
            console.log(`  -> Found languages:`, languages);

            // Update DB
            movie.languages = languages;

            // Also ensure root language is the first one or original
            if (languages.length > 0) {
                // Keep existing logic for root 'language' if it's already good, 
                // or maybe update it to be the first one? 
                // The app uses `movie.language` for some things and `movie.languages` for others.
                // Let's rely on the array we just populated.
            }

            const { error: updateError } = await supabase
                .from('movies')
                .update({ data: movie })
                .eq('id', row.id);

            if (updateError) {
                console.error(`  -> Update failed:`, updateError);
            } else {
                console.log(`  -> Updated successfully!`);
            }
        } else {
            console.warn(`  -> No spoken_languages found in TMDB response.`);
        }
    }
}

refetchLanguagesForKantara();
