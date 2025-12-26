
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

const IDS_TO_RESTORE = [
    '1213076', // Fight Club (2023)
    '391062',  // Joker (2016)
    '129507',  // Joker (2012)
    '48311',   // Parasite (1982)
    '87516'    // Oldboy (2013)
];

async function fetchTmdbData(id: string) {
    try {
        const url = `https://api.themoviedb.org/3/movie/${id}?append_to_response=credits,videos,release_dates`;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_READ_TOKEN}`
            }
        };
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error(`Failed to fetch ${id}`, e);
        return null;
    }
}

async function main() {
    console.log("⚠️ Restoring Deleted Movies from TMDB...");

    for (const id of IDS_TO_RESTORE) {
        console.log(`Fetching TMDB ID: ${id}...`);
        const tmdbData = await fetchTmdbData(id);

        if (tmdbData) {
            // Map to OneEntry Schema
            const movieRow = {
                id: `tmdb-${tmdbData.id}`,
                title: tmdbData.title,
                data: {
                    id: tmdbData.id,
                    title: tmdbData.title,
                    tagline: tmdbData.tagline,
                    overview: tmdbData.overview,
                    poster_path: tmdbData.poster_path,
                    backdrop_path: tmdbData.backdrop_path,
                    release_date: tmdbData.release_date,
                    releaseYear: tmdbData.release_date ? tmdbData.release_date.split('-')[0] : '',
                    runtime: tmdbData.runtime,
                    rating: tmdbData.vote_average,
                    voteCount: tmdbData.vote_count,
                    genres: tmdbData.genres,
                    cast: tmdbData.credits?.cast?.slice(0, 20).map((c: any) => ({
                        id: `tmdb-person-${c.id}`,
                        name: c.name,
                        role: c.character,
                        imageUrl: c.profile_path
                    })) || [],
                    director: tmdbData.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'Unknown',
                    streaming: []
                }
                // Removed created_at to let DB handle default
            };

            const { error } = await supabase.from('movies').upsert(movieRow);

            if (error) console.error(`   ❌ Restore Failed for ${tmdbData.title}:`, error.message);
            else console.log(`   ✅ Restored: ${tmdbData.title} (${tmdbData.release_date})`);
        }
    }
    console.log("\nRestoration Complete.");
}

main();
