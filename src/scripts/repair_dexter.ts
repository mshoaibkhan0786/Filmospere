
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Official TMDB ID for Dexter: Resurrection (Series)
// Wait, is it a series or movie? 
// User provided screenshot shows "2 Seasons", so it's likely TV Show with ID 246059?
// Let's first SEARCH TMDB to get the right ID, because "1308775" seemed to be the corrupted one?
// 1308775 on TMDB is "Manoos" (1939). That explains the Indian cast!
// The user has the WRONG TMDB ID linked to "Dexter: Resurrection".

// We need to find the REAL ID for Dexter Resurrection.
// It is likely a TV show (Dexter: Resurrection TV series is upcoming/announced).
// Or maybe a movie? 

// Strategy:
// 1. Search TMDB for "Dexter: Resurrection"
// 2. Get the correct ID and Metadata.
// 3. Update the DB entry.

async function repairDexter() {
    console.log("Repairing 'Dexter: Resurrection'...");

    // 1. Search TMDB
    console.log("Searching TMDB for correct ID...");
    const searchUrl = `${TMDB_BASE_URL}/search/multi?query=Dexter%20Resurrection&include_adult=false&language=en-US&page=1`;
    const searchRes = await fetch(searchUrl, {
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_READ_TOKEN}`
        }
    });

    const searchData = await searchRes.json();
    const hit = searchData.results?.[0]; // Best match

    if (!hit) {
        console.error("Could not find Dexter Resurrection on TMDB.");
        return;
    }

    console.log(`Found Correct Match: ${hit.title || hit.name} (${hit.media_type}) - ID: ${hit.id}`);

    // 2. Fetch Deep Details (Cast)
    const type = hit.media_type; // 'movie' or 'tv'
    const detailsUrl = `${TMDB_BASE_URL}/${type}/${hit.id}?append_to_response=credits,keywords,videos,images,recommendations,external_ids`;

    const detailsRes = await fetch(detailsUrl, {
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_READ_TOKEN}`
        }
    });
    const details = await detailsRes.json();
    console.log(`Fetched details. Cast count: ${details.credits?.cast?.length}`);

    // 3. Map to our format
    const newData = {
        tmdb_id: hit.id,
        overview: details.overview,
        posterUrl: details.poster_path,
        backdropUrl: details.backdrop_path,
        releaseDate: details.release_date || details.first_air_date,
        releaseYear: new Date(details.release_date || details.first_air_date).getFullYear(),
        runtime: details.runtime || (details.episode_run_time?.[0]) || 0,
        tagline: details.tagline,
        status: details.status,
        imdb_id: details.external_ids?.imdb_id,
        rating: details.vote_average,
        voteCount: details.vote_count,
        language: details.spoken_languages?.map((l: any) => l.english_name).join(', '),
        genres: details.genres?.map((g: any) => g.name).join(', '),
        tags: details.keywords?.results?.map((k: any) => k.name) || [],
        cast: details.credits?.cast?.slice(0, 20).map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
            role: c.character,
            image: c.profile_path
        })),
        director: details.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'N/A',
        contentType: type === 'tv' ? 'series' : 'movie'
    };

    // 4. Update Supabase (Find likely the corrupted row by title)
    // We update the row that currently has title "Dexter: Resurrection"

    // First, find the corrupted row ID
    const { data: currentRows } = await supabase
        .from('movies')
        .select('id, data')
        .ilike('title', 'Dexter: Resurrection');

    if (currentRows && currentRows.length > 0) {
        const rowToFix = currentRows[0];
        console.log(`Fixing DB Row ID: ${rowToFix.id}`);

        const { error } = await supabase
            .from('movies')
            .update({
                data: { ...rowToFix.data, ...newData } // Merge efficiently
            })
            .eq('id', rowToFix.id);

        if (error) console.error("Update failed:", error);
        else console.log("Success! Database updated with correct metadata.");
    } else {
        console.log("Could not find the target row in DB to update.");
    }

}

repairDexter();
