
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
// Use Token from src/services/tmdb.ts
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function repairRatings() {
    console.log("Starting Repair of Zero-Rated Hits...");

    // 1. Fetch Candidates (High Votes, Zero/Null Rating) OR specific target
    const { data: movies, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .or('data->voteCount.gt.1000,title.ilike.Kapag Tumayo%') // Explicitly target the problem movie
        .limit(200);

    if (error || !movies) {
        console.error("Fetch failed:", error);
        return;
    }

    // Process ALL fetched movies (since our query was specific)
    const glitched = movies;
    console.log(`Targeting ${glitched.length} candidates for repair...`);

    let fixedCount = 0;

    for (const m of glitched) {
        // Extract numeric TMDB ID from "tmdb-12345" string
        const tmdbId = m.id.replace('tmdb-', '');

        try {
            // 2. Fetch fresh data from TMDB (Using Token)
            const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${TMDB_READ_TOKEN}`
                }
            });
            if (!response.ok) {
                console.warn(`Failed to fetch TMDB data for ${m.title} (${tmdbId}): ${response.status}`);
                continue;
            }

            const tmdbData = await response.json();

            // 3. Prepare Update (Preserve AI Content!)
            const newRating = tmdbData.vote_average || 0;
            const newVotes = tmdbData.vote_count || 0;

            console.log(`Fixing '${m.title}': Rating ${m.data.rating} -> ${newRating}, Votes ${m.data.voteCount} -> ${newVotes}`);

            const updatedData = {
                ...m.data,
                rating: newRating,
                voteCount: newVotes,
                // Ensure other fields are touched ONLY if missing? 
                // No, just update rating/votes as requested to be safe.
                // We MIGHT update release date if valid? User asked for rating details.
            };

            const { error: updateError } = await supabase
                .from('movies')
                .update({ data: updatedData })
                .eq('id', m.id);

            if (!updateError) fixedCount++;
            else console.error(`Failed to update ${m.title}:`, updateError);

            // Small delay to be nice to API
            await new Promise(r => setTimeout(r, 100));

        } catch (err) {
            console.error(`Error processing ${m.title}:`, err);
        }
    }

    console.log(`\nRepair Complete. Fixed ${fixedCount} movies.`);
}

repairRatings();
