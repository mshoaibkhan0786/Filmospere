
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';

if (!supabaseUrl || !supabaseKey || !TMDB_READ_TOKEN) {
    console.error("Missing credentials");
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
        return null;
    }
}

async function main() {
    console.log("Starting SAFE Global Repair (RESUMING from index 6500)...");

    // Fetch ALL movies with pagination (SORTED by ID for consistency)
    console.log("Fetching all movies from DB (sorted by ID)...");
    let allMovies: any[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('movies')
            .select('id, data')
            .order('id', { ascending: true }) // CRITICAL: Ensure consistent order
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error("Error fetching movies:", error);
            break;
        }

        if (!data || data.length === 0) break;

        allMovies = allMovies.concat(data);
        console.log(`Fetched ${data.length} movies (Total: ${allMovies.length})...`);

        if (data.length < PAGE_SIZE) break;
        page++;
    }

    console.log(`Scanning ${allMovies.length} movies for corruption...`);

    const moviesToRepair = allMovies.filter(m => {
        return m.data.cast && m.data.cast.length > 0;
    });

    console.log(`Found ${moviesToRepair.length} movies with cast data to verify/repair.`);

    // 🔴 RESUME POINT: Start from index 6500 (Overlap is fine or safe)
    // Adjust this if you want to skip more or less
    const START_INDEX = 6500;
    console.log(`⏩ RESUMING from index ${START_INDEX}...`);

    let processedCount = 0;
    const BATCH_SIZE = 5;

    for (let i = START_INDEX; i < moviesToRepair.length; i += BATCH_SIZE) {
        if (i >= moviesToRepair.length) break;

        const batch = moviesToRepair.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (movie) => {
            const fullMovieData = movie.data;
            const existingWhyWatch = fullMovieData.whyWatch;
            const existingMetaTitle = fullMovieData.metaTitle;
            const existingMetaDesc = fullMovieData.metaDescription;
            const existingStream = fullMovieData.streaming;

            try {
                const freshCast = await fetchTmdbCast(movie.id);
                if (freshCast && freshCast.length > 0) {
                    const updatedCast = freshCast.slice(0, 30).map((c: any) => ({
                        id: `tmdb-person-${c.id}`,
                        name: c.name,
                        role: c.character,
                        imageUrl: c.profile_path
                    }));

                    const updatedData = {
                        ...fullMovieData,
                        cast: updatedCast,
                        whyWatch: existingWhyWatch,
                        metaTitle: existingMetaTitle,
                        metaDescription: existingMetaDesc,
                        streaming: existingStream
                    };

                    const { error: updateError } = await supabase
                        .from('movies')
                        .update({ data: updatedData })
                        .eq('id', movie.id);

                    if (!updateError) {
                        processedCount++;
                        if (processedCount % 50 === 0) console.log(`   Repaired ${processedCount} movies (Current Index: ${i})...`);
                    } else {
                        console.error(`Failed to update ${fullMovieData.title}`);
                    }
                }
            } catch (err) {
                console.error(`Error processing ${fullMovieData.title}`);
            }
        }));

        await new Promise(r => setTimeout(r, 250));
    }

    console.log(`\n✅ Resume Complete. Repaired ${processedCount} movies.`);
}

main();
