
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_API_KEY = process.env.TMDB_API_KEY || '8da2d8399f3af98c4d290b2aaacc602e';

// Target IDs for Doraemon
const TARGET_IDS = ['65733', '57911']; // 2005 and 1979 series
const manualDataPath = path.join(__dirname, '../data/manualMovies.ts');

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTMDB(endpoint: string) {
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) {
        if (response.status === 429) {
            console.warn('Rate limited. Waiting 3s...');
            await sleep(3000);
            return fetchTMDB(endpoint);
        }
        if (response.status === 404) return null;
        throw new Error(`TMDB Error ${response.status}: ${url}`);
    }
    return response.json();
}

async function run() {
    console.log('Fetching Doraemon episodes...');

    if (!fs.existsSync(manualDataPath)) {
        console.error('manualMovies.ts not found');
        return;
    }

    const content = fs.readFileSync(manualDataPath, 'utf-8');
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');

    if (start === -1) {
        console.error('Could not parse manualMovies.ts');
        return;
    }

    const jsonStr = content.substring(start, end + 1);
    let movies: any[] = [];
    try {
        movies = JSON.parse(jsonStr);
    } catch (e) {
        console.error('JSON parse error:', e.message);
        // Fallback: If JSON parse fails (e.g. comments?), we can't easily edit.
        // But for generated file it should be fine.
        return;
    }

    let updated = false;

    for (const id of TARGET_IDS) {
        const fullId = `tmdb-${id}`;
        const movieIndex = movies.findIndex(m => m.id === fullId);

        if (movieIndex === -1) {
            console.log(`ID ${fullId} not found in manualMovies.ts`);
            continue;
        }

        console.log(`Processing ${movies[movieIndex].title} (${id})...`);

        // Fetch TV Show Details
        const details = await fetchTMDB(`/tv/${id}`);
        if (!details) {
            console.log('TV Show details not found.');
            continue;
        }

        const seasonsMeta = details.seasons || [];
        console.log(`Found ${seasonsMeta.length} seasons.`);

        const fullSeasons = [];
        let seasonCounter = 0;

        for (const s of seasonsMeta) {
            // Optional: Limit seasons if too many? Doraemon has TONS.
            // User said "episode details skipped to save api".
            // If I fetch ALL, it might be 100+ requests.
            // I'll fetch them. But be patient.
            console.log(`  Fetching Season ${s.season_number} (${s.episode_count} eps)...`);

            const seasonData = await fetchTMDB(`/tv/${id}/season/${s.season_number}`);
            if (seasonData) {
                fullSeasons.push({
                    id: s.id,
                    seasonNumber: s.season_number,
                    name: s.name,
                    overview: s.overview,
                    posterUrl: s.poster_path ? `https://image.tmdb.org/t/p/w300${s.poster_path}` : undefined,
                    airDate: s.air_date,
                    episodeCount: seasonData.episodes?.length || s.episode_count,
                    episodes: seasonData.episodes?.map((e: any) => ({
                        id: e.id,
                        episodeNumber: e.episode_number,
                        name: e.name,
                        overview: e.overview,
                        airDate: e.air_date,
                        stillUrl: e.still_path ? `https://image.tmdb.org/t/p/w300${e.still_path}` : undefined,
                        voteAverage: e.vote_average,
                        runtime: e.runtime
                    })) || []
                });
            }
            await sleep(300); // Rate limiting
            seasonCounter++;
            if (seasonCounter % 10 === 0) console.log('    ...pausing for API niceness...');
        }

        // Update the movie object
        movies[movieIndex].seasons = fullSeasons;
        movies[movieIndex].contentType = 'series'; // Ensure it's marked as series
        movies[movieIndex].hiddenTags = [...(movies[movieIndex].hiddenTags || []), 'Anime', 'Kids']; // Enriched

        updated = true;
        console.log(`Updated ${movies[movieIndex].title} with ${fullSeasons.length} seasons.`);
    }

    if (updated) {
        console.log('Saving manualMovies.ts (this might take a moment)...');
        const newContent = `import type { Movie } from '../types';\n\nexport const manualMovies: Movie[] = ${JSON.stringify(movies, null, 4)};\n`;
        fs.writeFileSync(manualDataPath, newContent);
        console.log('Saved!');
    } else {
        console.log('No updates made.');
    }
}

run().catch(console.error);
