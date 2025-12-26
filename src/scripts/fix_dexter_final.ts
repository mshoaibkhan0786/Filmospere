
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

async function repairDexterFinal() {
    console.log("Repairing 'Dexter: Resurrection' (FINAL FIX)...");

    // 1. Fetch Correct Details for TV Show 259909
    const hitId = 259909; // Confirmed ID
    const detailsUrl = `${TMDB_BASE_URL}/tv/${hitId}?append_to_response=credits,keywords`;

    const detailsRes = await fetch(detailsUrl, {
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_READ_TOKEN}`
        }
    });

    if (!detailsRes.ok) {
        console.error("Failed to fetch from TMDB", detailsRes.status);
        return;
    }

    const details = await detailsRes.json();
    console.log(`Fetched details for ${details.name}. Cast: ${details.credits?.cast?.length}`);

    // 2. Map Correctly
    const newCast = details.credits?.cast?.slice(0, 20).map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        role: c.character,
        imageUrl: c.profile_path // CORRECT KEY: imageUrl (not image)
    }));

    const newDirector = details.credits?.crew?.find((c: any) => c.job === 'Director' || c.job === 'Showrunner' || c.job === 'Executive Producer')?.name || 'N/A';

    const newPoster = details.poster_path;
    const newBackdrop = details.backdrop_path;
    const newLanguage = 'English'; // Force English
    const newStatus = details.status;

    // Duration Logic for Series
    // "1 Season" or "Returning Series"
    const durationStr = details.number_of_seasons + (details.number_of_seasons === 1 ? ' Season' : ' Seasons');

    // 3. Update Supabase
    const { data: currentRows } = await supabase
        .from('movies')
        .select('id, data')
        .ilike('title', 'Dexter: Resurrection');

    if (currentRows && currentRows.length > 0) {
        const rowToFix = currentRows[0];
        console.log(`Fixing DB Row ID: ${rowToFix.id}`);

        const updatedData = {
            ...rowToFix.data,
            // OVERWRITE these fields with correct data
            tmdb_id: hitId,
            cast: newCast,         // Fixed Key
            director: newDirector,
            posterUrl: newPoster,  // Fixed Poster
            backdropUrl: newBackdrop,
            language: newLanguage, // Fixed Language
            status: newStatus,
            duration: durationStr, // Fixed Duration string
            contentType: 'series', // Ensure Series

            // Explicitly ensure 'images' array exists if missing (optional)
        };

        const { error } = await supabase
            .from('movies')
            .update({
                data: updatedData
            })
            .eq('id', rowToFix.id);

        if (error) console.error("Update failed:", error);
        else console.log("Success! Metadata fully synchronized.");
    } else {
        console.log("Could not find the target row in DB to update.");
    }
}

repairDexterFinal();
