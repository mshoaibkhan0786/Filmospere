
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U'; // Hardcoded for script simplicity based on tmdb.ts

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchTmdbCast(tmdbId: string) {
    const numericId = tmdbId.replace('tmdb-', '');
    try {
        const url = `https://api.themoviedb.org/3/movie/${numericId}/credits`;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_READ_TOKEN}`
            }
        };
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
        const data = await res.json();
        return data.cast || [];
    } catch (e) {
        console.error(`Failed to fetch credits for ${tmdbId}:`, e);
        return null;
    }
}

async function main() {
    console.log("Starting SRK Role Repair...");

    // List of known/suspected SRK movies to check and repair
    const targetTitles = [
        'Zero', 'Jawan', 'Pathaan', 'Dunki', 'Dilwale',
        'Raees', 'Fan', 'Happy New Year', 'Chennai Express',
        'Jab Tak Hai Jaan', 'Don 2', 'Ra.One', 'My Name Is Khan',
        'Rab Ne Bana Di Jodi', 'Om Shanti Om', 'Chak De! India',
        'Don', 'Kabhi Alvida Naa Kehna', 'Swades', 'Veer-Zaara',
        'Main Hoon Na', 'Kal Ho Naa Ho', 'Devdas', 'Kabhi Khushi Kabhie Gham',
        'Mohabbatein', 'Kuch Kuch Hota Hai', 'Dil To Pagal Hai', 'Dil Se..',
        'Dilwale Dulhania Le Jayenge', 'Karan Arjun', 'Baazigar', 'Darr'
    ];

    console.log(`Targeting ${targetTitles.length} specific movies to avoid timeouts...`);

    for (const title of targetTitles) {
        // Fetch movie by title
        const { data: movies, error } = await supabase
            .from('movies')
            .select('*')
            .ilike('title', title);

        if (error || !movies || movies.length === 0) {
            console.log(`Skipping '${title}' (Not found or Error)`);
            continue;
        }

        // Handle duplicates (e.g. Zero 2018 vs 2012)
        for (const movie of movies) {
            const fullMovieData = movie.data;
            const currentCast = fullMovieData.cast || [];
            const srk = currentCast.find((c: any) => c.name.toLowerCase().includes('shah rukh'));

            // Only process if SRK is actually in the cast
            if (!srk) continue;

            console.log(`\nProcessing: ${fullMovieData.title} (${fullMovieData.releaseYear})`);
            console.log(`Current Role: "${srk.role}"`);

            // Always fetch fresh to ensure correctness
            const freshCast = await fetchTmdbCast(movie.id);
            if (!freshCast) {
                console.log("-> Skipping update (failed to fetch fresh cast).");
                continue;
            }

            // Rebuild Cast Array
            const updatedCast = freshCast.slice(0, 20).map((c: any) => ({
                id: `tmdb-person-${c.id}`,
                name: c.name,
                role: c.character, // Correct role from TMDB
                imageUrl: c.profile_path
            }));

            // Verify
            const newSrk = updatedCast.find((c: any) => c.name.toLowerCase().includes('shah rukh'));
            if (newSrk) {
                console.log(`Terminated Role: "${srk.role}" -> New Role: "${newSrk.role}"`);

                // Update Supabase
                const updatedData = {
                    ...fullMovieData,
                    cast: updatedCast
                };

                const { error: updateError } = await supabase
                    .from('movies')
                    .update({ data: updatedData })
                    .eq('id', movie.id);

                if (updateError) {
                    console.error("-> Update Failed:", updateError);
                } else {
                    console.log("-> Update SUCCESS.");
                }
            } else {
                console.warn("-> SRK not found in FRESH TMDB cast! Keeping original cast.");
            }
        }
    }
}

main();
