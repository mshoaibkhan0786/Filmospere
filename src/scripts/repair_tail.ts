
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

if (!supabaseUrl || !supabaseKey || !TMDB_READ_TOKEN) process.exit(1);

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
    console.log("Starting Tail-End Repair (Last 3000 movies)...");

    // Fetch Last 3000 movies by ID DESC (Paginated)
    console.log("Fetching last 3000 movies (Descending)...");

    let allMovies: any[] = [];
    const TOTAL_TARGET = 3000;
    const PAGE_SIZE = 500; // Smaller chunks to avoid timeout

    for (let page = 0; page < (TOTAL_TARGET / PAGE_SIZE); page++) {
        console.log(`Fetching Page ${page + 1}...`);
        const { data, error } = await supabase
            .from('movies')
            .select('id, data')
            .order('id', { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error("Fetch Error:", error);
            break;
        }
        if (data) {
            allMovies = allMovies.concat(data);
            console.log(`Fetched Page ${page + 1} (${data.length} items)...`);
        }
    }

    console.log(`Total Tail Fetched: ${allMovies.length} movies.`);

    const moviesToRepair = allMovies.filter(m => m.data.cast && m.data.cast.length > 0);
    console.log(`Checking ${moviesToRepair.length} movies...`);

    let processedCount = 0;
    const BATCH_SIZE = 5;

    // Process
    for (let i = 0; i < moviesToRepair.length; i += BATCH_SIZE) {
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
                        if (processedCount % 50 === 0) console.log(`   Repaired ${processedCount} tail movies...`);
                    }
                }
            } catch (err) {
                // ignore
            }
        }));

        await new Promise(r => setTimeout(r, 250));
    }

    console.log(`\n✅ Tail Repair Complete. Repaired ${processedCount} movies.`);
}

main();
