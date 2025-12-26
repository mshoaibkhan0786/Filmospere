
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';

async function debugSpecificMovie() {
    console.log("Debugging 'Kapag Tumayo Ang Testigo'...");

    // 2. Fetch from DB
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', 'Kapag Tumayo Ang Testigo%');

    if (error || !movies || movies.length === 0) {
        console.error("Movie not found in DB.");
        return;
    }

    const m = movies[0];
    const tmdbId = m.id.replace('tmdb-', '');
    console.log(`DB Movie: ${m.title} (ID: ${tmdbId}) | Votes: ${m.data.voteCount} | Rating: ${m.data.rating}`);

    // 3. Test TMDB Fetch with Token
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}`;
    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_READ_TOKEN}`
            }
        });

        if (res.status === 401) {
            console.error("❌ TMDB API 401 Unauthorized - Token is invalid.");
        } else if (res.ok) {
            const json = await res.json();
            console.log(`✅ TMDB Data: Votes: ${json.vote_count} | Rating: ${json.vote_average}`);
        } else {
            console.error(`❌ TMDB Error: ${res.status}`);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

debugSpecificMovie();
