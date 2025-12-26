
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_API_KEY = '8da2d8399f3af98c4d290b2aaacc602e';
const TARGET_ACTOR_COUNT = 500;
const TARGET_DIRECTOR_COUNT = 100;

// Paths
const publicMoviesPath = path.join(__dirname, '../../public/movies.json');
const outputActorsPath = path.join(__dirname, '../../public/actors.json');
const outputDirectorMapPath = path.join(__dirname, '../../public/directorMap.json');

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPersonDetails(tmdbId: string) {
    const url = `https://api.themoviedb.org/3/person/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=images`;
    const res = await fetch(url);
    if (res.status === 429) {
        console.log('Rate limited... waiting');
        await sleep(2000);
        return fetchPersonDetails(tmdbId);
    }
    if (!res.ok) return null;
    return res.json();
}

async function searchPerson(name: string) {
    const url = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    if (res.status === 429) {
        await sleep(2000);
        return searchPerson(name);
    }
    if (!res.ok) return null;
    const data = await res.json();
    return data.results && data.results.length > 0 ? data.results[0] : null;
}

async function run() {
    console.log('Reading movies...');
    if (!fs.existsSync(publicMoviesPath)) {
        console.error('Movies file not found!');
        return;
    }

    const movies = JSON.parse(fs.readFileSync(publicMoviesPath, 'utf-8'));
    const actorCounts = new Map<string, number>();
    const directorCounts = new Map<string, number>();

    console.log(`Analyzing data from ${movies.length} movies...`);

    movies.forEach((movie: any) => {
        // Actors
        if (movie.cast) {
            movie.cast.forEach((c: any) => {
                const rawId = c.id;
                const match = rawId.match(/-(\d+)$/) || rawId.match(/^(\d+)$/);
                if (match) {
                    const tmdbId = match[1];
                    actorCounts.set(tmdbId, (actorCounts.get(tmdbId) || 0) + 1);
                }
            });
        }
        // Directors
        if (movie.director) {
            // Trim and clean
            const name = movie.director.trim();
            if (name) {
                directorCounts.set(name, (directorCounts.get(name) || 0) + 1);
            }
        }
    });

    // --- PROCESS ACTORS ---
    const sortedActors = [...actorCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TARGET_ACTOR_COUNT);

    console.log(`Processing ${sortedActors.length} top actors...`);

    let existingActors: Record<string, any> = {};
    if (fs.existsSync(outputActorsPath)) {
        existingActors = JSON.parse(fs.readFileSync(outputActorsPath, 'utf-8'));
    }

    // --- PROCESS DIRECTORS ---
    const sortedDirectors = [...directorCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TARGET_DIRECTOR_COUNT);

    console.log(`Processing ${sortedDirectors.length} top directors...`);

    let directorMap: Record<string, string> = {};
    if (fs.existsSync(outputDirectorMapPath)) {
        directorMap = JSON.parse(fs.readFileSync(outputDirectorMapPath, 'utf-8'));
    }

    // Resolve Directors to IDs
    for (const [name, count] of sortedDirectors) {
        if (!directorMap[name]) {
            console.log(`Searching ID for director: ${name}`);
            try {
                const searchResult = await searchPerson(name);
                if (searchResult) {
                    directorMap[name] = searchResult.id.toString();
                    await sleep(200);
                } else {
                    console.log(`Could not find director: ${name}`);
                }
            } catch (e) {
                console.error(`Error searching ${name}`, e);
            }
        }
    }
    fs.writeFileSync(outputDirectorMapPath, JSON.stringify(directorMap, null, 2));

    // Consolidate IDs to fetch (Actors + Directors)
    const idsToFetch = new Set<string>();

    // Add Actors
    sortedActors.forEach(([id]) => idsToFetch.add(id));
    // Add Directors (resolved IDs)
    Object.values(directorMap).forEach(id => idsToFetch.add(id));

    let updatedCount = 0;

    for (const tmdbId of idsToFetch) {
        if (existingActors[tmdbId]) {
            continue;
        }

        try {
            console.log(`Fetching details for ID ${tmdbId}...`);
            const details = await fetchPersonDetails(tmdbId);
            if (details) {
                existingActors[tmdbId] = {
                    id: tmdbId,
                    name: details.name,
                    biography: details.biography,
                    birthday: details.birthday,
                    deathday: details.deathday,
                    place_of_birth: details.place_of_birth,
                    profile_path: details.profile_path,
                    images: details.images?.profiles?.map((p: any) => p.file_path) || [],
                    known_for_department: details.known_for_department
                };
                updatedCount++;
                await sleep(100);
            }
        } catch (e) {
            console.error(`Error fetching ${tmdbId}:`, e);
        }
    }

    fs.writeFileSync(outputActorsPath, JSON.stringify(existingActors, null, 2));
    console.log(`Done. Saved ${Object.keys(existingActors).length} people records. Updated ${updatedCount}.`);
}

run().catch(console.error);
