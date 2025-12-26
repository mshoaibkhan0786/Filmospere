
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
// User must provide this key
const TMDB_API_KEY = process.env.TMDB_API_KEY || '8da2d8399f3af98c4d290b2aaacc602e';
const TARGET_COUNT = 50;
const BATCH_SIZE = 20; // movies per page
const PAGES_TO_FETCH = Math.ceil(TARGET_COUNT / BATCH_SIZE); // 50 pages

// Paths
const tmdbDataPath = path.join(__dirname, '../data/tmdbMovies.json');
const manualDataPath = path.join(__dirname, '../../_archive/manualMovies.ts'); // Just for ID checking

// --- Types ---
// Minimal local definition to avoid import issues in script
interface Movie {
    id: string;
    title: string;
    // ... other fields loosely typed
    [key: string]: any;
}

// --- Helpers ---
async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        if (response.status === 429) {
            console.warn('Rate limited. Waiting...');
            await sleep(2000);
            return fetchTMDB(endpoint, params);
        }
        throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

async function fetchMovieDetails(id: number) {
    // Append extra info
    return fetchTMDB(`/movie/${id}`, {
        append_to_response: 'credits,videos,images,release_dates,external_ids,keywords'
    });
}

function mapTMDBToMovie(details: any): Movie {
    const director = details.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'Unknown';
    const cast = details.credits?.cast?.slice(0, 10).map((c: any) => ({
        id: `tmdb-person-${c.id}`,
        name: c.name,
        role: c.character || 'Actor',
        imageUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined
    })) || [];

    const videos = details.videos?.results?.map((v: any) => ({
        id: v.id,
        title: v.name,
        thumbnailUrl: `https://img.youtube.com/vi/${v.key}/mqdefault.jpg`,
        videoUrl: `https://www.youtube.com/watch?v=${v.key}`,
        duration: "0m"
    })) || [];

    const trailer = videos.find((v: any) => v.type === 'Trailer' || v.type === 'Teaser');

    const images = details.images?.backdrops?.slice(0, 5).map((i: any) => `https://image.tmdb.org/t/p/original${i.file_path}`) || [];

    const usRelease = details.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US');
    const certification = usRelease?.release_dates?.find((d: any) => d.certification)?.certification || '';

    const tags = details.genres?.map((g: any) => g.name) || [];
    const keywords = details.keywords?.keywords?.map((k: any) => k.name) || [];

    return {
        id: `tmdb-${details.id}`,
        title: details.title,
        releaseYear: new Date(details.release_date).getFullYear() || 0,
        releaseDate: details.release_date,
        budget: details.budget > 0 ? `$${(details.budget / 1000000).toFixed(1)}M` : undefined,
        boxOffice: details.revenue > 0 ? `$${(details.revenue / 1000000).toFixed(1)}M` : undefined,
        duration: `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`,
        posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
        director,
        description: details.overview,
        rating: details.vote_average,
        voteCount: details.vote_count,
        views: Math.floor(details.popularity * 1000),
        tags,
        hiddenTags: [certification, details.original_language, ...keywords],
        cast,
        trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,
        streamingLinks: [],
        isCopyrightFree: false,
        language: details.original_language,
        languages: details.spoken_languages?.map((l: any) => l.name) || [],
        contentType: 'movie',
        images,
        videos
    };
}

async function run() {
    if (TMDB_API_KEY === 'REPLACE_WITH_YOUR_KEY') {
        console.error('ERROR: Please set your TMDB_API_KEY in the script or environment variables.');
        process.exit(1);
    }

    console.log(`Fetching ${TARGET_COUNT} popular movies...`);

    const existingIds = new Set<string>();

    if (fs.existsSync(tmdbDataPath)) {
        const raw = fs.readFileSync(tmdbDataPath, 'utf-8');
        const movies = JSON.parse(raw);
        movies.forEach((m: any) => {
            if (m.id.startsWith('tmdb-')) {
                existingIds.add(m.id.replace('tmdb-', ''));
            }
        });
        console.log(`Loaded ${existingIds.size} existing TMDB IDs.`);
    }

    const newMovies: Movie[] = [];
    let page = 1;
    // let page = Math.floor(existingIds.size / 20) + 1; 
    console.log(`Starting scan from page ${page} (Top Rated)...`);

    while (newMovies.length < TARGET_COUNT && page <= 500) {
        console.log(`Fetching page ${page}...`);
        try {
            const data = await fetchTMDB('/movie/top_rated', { page: page.toString() });
            const results = data.results || [];

            for (const item of results) {
                if (newMovies.length >= TARGET_COUNT) break;

                const tmdbId = item.id.toString();
                if (existingIds.has(tmdbId)) {
                    // process.stdout.write('.');
                    continue; // Skip existing
                }

                // Fetch full details
                // console.log(`\nFetching details for ${item.title}`);
                const details = await fetchMovieDetails(item.id);
                const movie = mapTMDBToMovie(details);
                newMovies.push(movie);
                existingIds.add(tmdbId);

                process.stdout.write('+');
                await sleep(50); // Ratelimit nice
            }
            page++;
            await sleep(200);
        } catch (e) {
            console.error('Error in loop:', e);
            break;
        }
    }

    console.log(`\nCollected ${newMovies.length} new movies.`);

    if (newMovies.length > 0) {
        // Append to tmdbMovies.json
        // We need to read whole file again?? Yes.
        // If file big, we might want to stream, but 80MB is okay for Node.
        let allMovies: Movie[] = [];
        if (fs.existsSync(tmdbDataPath)) {
            allMovies = JSON.parse(fs.readFileSync(tmdbDataPath, 'utf-8'));
        }
        allMovies = [...allMovies, ...newMovies];

        fs.writeFileSync(tmdbDataPath, JSON.stringify(allMovies, null, 2));
        console.log(`Updated ${tmdbDataPath}. Total count: ${allMovies.length}`);
    } else {
        console.log('No new movies found.');
    }
}

run().catch(console.error);
