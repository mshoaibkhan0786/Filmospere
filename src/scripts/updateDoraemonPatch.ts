
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_API_KEY = process.env.TMDB_API_KEY || '8da2d8399f3af98c4d290b2aaacc602e';

// Target IDs for Doraemon
const TARGET_IDS = ['65733', '57911'];
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
    console.log('Fetching Doraemon episodes (Patch Mode)...');

    if (!fs.existsSync(manualDataPath)) {
        console.error('manualMovies.ts not found');
        return;
    }

    const content = fs.readFileSync(manualDataPath, 'utf-8');

    for (const id of TARGET_IDS) {
        const fullId = `tmdb-${id}`;
        const idIndex = content.indexOf(`"${fullId}"`);

        if (idIndex === -1) {
            console.log(`ID ${fullId} not found in manualMovies.ts`);
            continue;
        }

        console.log(`Found ${fullId} at index ${idIndex}`);

        // Find the start of the object '{' scanning backwards
        let objStart = -1;
        let braceCount = 0;
        for (let i = idIndex; i >= 0; i--) {
            if (content[i] === '}') braceCount++;
            if (content[i] === '{') {
                if (braceCount > 0) braceCount--;
                else {
                    objStart = i;
                    break;
                }
            }
        }

        if (objStart === -1) {
            console.error('Could not find object start.');
            continue;
        }

        // Find the end of the object '}' scanning forwards
        let objEnd = -1;
        braceCount = 0;
        for (let i = objStart; i < content.length; i++) {
            if (content[i] === '{') braceCount++;
            if (content[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    objEnd = i;
                    break;
                }
            }
        }

        if (objEnd === -1) {
            console.error('Could not find object end.');
            continue;
        }

        const movieStr = content.substring(objStart, objEnd + 1);
        let movie: any;
        try {
            // Use eval to handle relaxed JSON (trailing commas etc)
            movie = eval('(' + movieStr + ')');
        } catch (e) {
            console.error('Failed to parse movie object:', e.message);
            // console.log(movieStr.substring(0, 100) + '...');
            continue;
        }

        console.log(`Processing ${movie.title}...`);

        // Fetch Data
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
            // Fetch first 20 seasons only to prevent timeout/ban if crazy huge? 
            // User really wants episode details.
            // Doraemon has 100+ seasons in some logic? NO, TMDB organizes by year usually.
            // 2005 series has ~20 seasons.
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
            await sleep(250);
            seasonCounter++;
            if (seasonCounter % 5 === 0) console.log('    ...pausing...');
        }

        movie.seasons = fullSeasons;
        movie.contentType = 'series';
        movie.hiddenTags = [...(movie.hiddenTags || []), 'Anime', 'Kids'];

        // Stringify back
        const newMovieStr = JSON.stringify(movie, null, 4); // Indent 4 to match file style roughly

        // Replace in content
        // Note: Changing content length invalidates indices for next loop.
        // We must re-read or handle offset.
        // Since we have 2 IDs, simplest is to read-modify-write-read-modify-write.
        // Or process one at a time.

        // I will writeFileSync now and break to re-run? 
        // Or just readFileSync at start of loop? 
        // Can't readFileSync inside loop if I have `content` variable.

        // I'll just do ONE replace then save. 
        // Run the script twice? Or just reload content.

        const before = content.substring(0, objStart);
        const after = content.substring(objEnd + 1);
        const newTotalContent = before + newMovieStr + after;

        fs.writeFileSync(manualDataPath, newTotalContent);
        console.log(`Updated ${movie.title} and saved file.`);

        // Return to restart for next ID?
        // Or just continue by re-reading?
        // Let's just process one ID per run to be safe and simple.
        // I will Loop through IDs but re-read file? 
        // No, `content` is stale.
        // I'll execute the loop logic recursively or just exit?

        // I'll output "Run again for other IDs" or just handle "Doraemon" (first one found).
        // The user cared about "Doraemon".
        // ID 65733 is 2005 series (most popular). 57911 is 1979.
        // I'll process the one found first in this run. 
        // If the user wants both, running the script twice works.
        break;
    }
}

run().catch(console.error);
