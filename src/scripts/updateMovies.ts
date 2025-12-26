// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { manualMovies } from '../../_archive/manualMovies';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const TMDB_API_KEY = process.env.TMDB_API_KEY || '8da2d8399f3af98c4d290b2aaacc602e';
const UPDATE_COUNT = 10000; // Aim to process all candidates 

// Paths
const manualDataPath = path.join(__dirname, '../../_archive/manualMovies.ts');

// --- Types ---
interface Movie {
    id: string;
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

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            if (response.status === 429) {
                console.warn('Rate limited. Waiting 2s...');
                await sleep(2000);
                return fetchTMDB(endpoint, params);
            }
            if (response.status === 404) return null;
            return null; // Ignore other errors
        }
        return response.json();
    } catch (e) {
        return null;
    }
}

// Fetch details + watch providers
async function fetchMovieDetails(id: number) {
    return fetchTMDB(`/movie/${id}`, {
        append_to_response: 'credits,videos,images,release_dates,keywords,watch/providers'
    });
}

function getProviderLogo(logoPath: string) {
    if (!logoPath) return undefined;
    return `https://image.tmdb.org/t/p/original${logoPath}`;
}

// Map the "Watch Providers" data to our simple StreamingLink format
function mapStreamingLinks(providers: any) {
    const links: any[] = [];
    const regions = [
        { code: 'US', label: 'US' },
        { code: 'GB', label: 'GB' },
        { code: 'IN', label: 'IN' },
        { code: 'AU', label: 'AU' }
    ];

    for (const region of regions) {
        const data = providers?.results?.[region.code];
        if (!data) continue;

        const sources = [
            ...(data.flatrate || []),
            ...(data.free || []),
            ...(data.ads || [])
        ];

        const seen = new Set();
        for (const p of sources) {
            if (seen.has(p.provider_name)) continue;
            seen.add(p.provider_name);

            links.push({
                platform: p.provider_name,
                url: data.link,
                icon: getProviderLogo(p.logo_path),
                country: region.label
            });
        }
    }
    return links;
}

function mapTMDBToMovie(details: any, oldMovie: any): any {
    // Only update specific fields
    const streamingLinks = mapStreamingLinks(details['watch/providers']);

    // Metadata Updates
    const budget = details.budget > 0 ? `$${(details.budget / 1000000).toFixed(1)}M` : oldMovie.budget;
    const boxOffice = details.revenue > 0 ? `$${(details.revenue / 1000000).toFixed(1)}M` : oldMovie.boxOffice;
    const tagline = details.tagline || oldMovie.tagline;
    const productionCompanies = details.production_companies?.map((c: any) => c.name) || oldMovie.productionCompanies;
    const status = details.status || oldMovie.status;
    const originalTitle = details.original_title || oldMovie.originalTitle;

    return {
        ...oldMovie,
        budget,
        boxOffice,
        tagline,
        productionCompanies,
        status,
        originalTitle,
        streamingLinks: streamingLinks.length > 0 ? streamingLinks : oldMovie.streamingLinks
    };
}

async function run() {
    console.log('Starting Streaming Check on manualMovies.ts...');

    // Load movies from import (memory)
    // IMPORTANT: Clone the array to avoid direct mutation issues if any (though unlikely with ES modules)
    let movies = JSON.parse(JSON.stringify(manualMovies));

    const candidates = movies.filter((m: any) => m.id.startsWith('tmdb-'));
    console.log(`Found ${candidates.length} TMDB movies.`);

    let updatedCount = 0;
    const start = Date.now();

    // Process loop
    for (let i = 0; i < candidates.length; i++) {
        const oldMovie = candidates[i];
        const tmdbId = parseInt(oldMovie.id.replace('tmdb-', ''));

        // Log every 50
        if (i % 50 === 0) {
            const elapsed = (Date.now() - start) / 1000;
            const rate = i / (elapsed || 1);
            const remaining = (candidates.length - i) / (rate || 1);
            process.stdout.write(`\n${i}/${candidates.length} (${(i / candidates.length * 100).toFixed(1)}%) | ETA: ${(remaining / 60).toFixed(1)}m | `);
        }

        try {
            const details = await fetchMovieDetails(tmdbId);
            if (details) {
                const newMovie = mapTMDBToMovie(details, oldMovie);
                const idx = movies.findIndex((m: any) => m.id === oldMovie.id);
                if (idx !== -1) {
                    movies[idx] = newMovie;
                    updatedCount++;
                    process.stdout.write('.');
                }
            } else {
                process.stdout.write('x');
            }
            await sleep(20);
        } catch (e) {
            process.stdout.write('E');
        }
    }

    console.log(`\nUpdated ${updatedCount} movies. Saving...`);

    // Write back to TS file
    // We must ensure 'import type { Movie }' remains.
    // And 'export const manualMovies: Movie[] ='
    const content = `import type { Movie } from '../types';\n\nexport const manualMovies: Movie[] = ${JSON.stringify(movies, null, 4)};`;

    // Use utf-8
    fs.writeFileSync(manualDataPath, content, 'utf-8');
    console.log('Saved manualMovies.ts!');
}

run().catch(console.error);
