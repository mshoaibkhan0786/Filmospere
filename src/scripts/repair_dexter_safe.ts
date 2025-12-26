
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

async function repairDexterSafe() {
    console.log("Repairing 'Dexter: Resurrection' (SAFE MODE)...");

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
    const hit = searchData.results?.[0];

    if (!hit) {
        console.error("Could not find Dexter Resurrection on TMDB.");
        return;
    }

    console.log(`Found Correct Match: ${hit.title || hit.name} (${hit.media_type}) - ID: ${hit.id}`);

    // 2. Fetch Deep Details (Cast ONLY)
    const type = hit.media_type;
    const detailsUrl = `${TMDB_BASE_URL}/${type}/${hit.id}?append_to_response=credits`;

    const detailsRes = await fetch(detailsUrl, {
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_READ_TOKEN}`
        }
    });
    const details = await detailsRes.json();

    const newCast = details.credits?.cast?.slice(0, 20).map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        role: c.character,
        image: c.profile_path
    }));

    const newDirector = details.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'N/A';

    // 3. Update Supabase - PRESERVING CONTENT
    const { data: currentRows } = await supabase
        .from('movies')
        .select('id, data')
        .ilike('title', 'Dexter: Resurrection');

    if (currentRows && currentRows.length > 0) {
        const rowToFix = currentRows[0];
        console.log(`Fixing DB Row ID: ${rowToFix.id}`);

        // Construct safe update payload
        const updatedData = {
            ...rowToFix.data,
            tmdb_id: hit.id,       // CRITICAL: Update ID to prevent future corruptions
            cast: newCast,         // CRITICAL: The requested fix
            director: newDirector, // Safe to update
            // Preserve everything else (Overview, images, layout, custom fields) by correct spreading order
            // Actually, we simply DON'T overwrite them.
            // Spreading `...rowToFix.data` first, then overwriting specific keys ensures safety.
        };

        const { error } = await supabase
            .from('movies')
            .update({
                data: updatedData
            })
            .eq('id', rowToFix.id);

        if (error) console.error("Update failed:", error);
        else console.log("Success! Top Cast updated. AI content preserved.");
    } else {
        console.log("Could not find the target row in DB to update.");
    }

}

repairDexterSafe();
