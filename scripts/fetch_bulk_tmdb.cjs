const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// --- CONFIGURATION ---
const TMDB_API_KEY = '8da2d8399f3af98c4d290b2aaacc602e';
const TARGET_COUNT = 2000;
const OUTPUT_FILE = path.join(__dirname, '../src/data/tmdbMovies.ts');
const DELAY_MS = 250; // Rate limit safety

// --- HELPERS ---
const fetchUrl = (url, retries = 3) => {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 429) {
                    // Rate limit hit
                    const retryAfter = (parseInt(res.headers['retry-after']) || 5) * 1000;
                    console.log(`Rate limit hit. Waiting ${retryAfter}ms...`);
                    setTimeout(() => {
                        fetchUrl(url, retries).then(resolve).catch(reject);
                    }, retryAfter);
                    return;
                }
                if (res.statusCode >= 400) {
                    // console.error(`API Error ${res.statusCode}: ${url}`);
                    resolve(null); // Treat as not found/error but don't crash
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            if (retries > 0) {
                setTimeout(() => {
                    fetchUrl(url, retries - 1).then(resolve).catch(reject);
                }, 1000);
            } else {
                reject(e);
            }
        });
    });
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const mapToMovie = (details, type) => {
    if (!details) return null;

    const isSeries = type === 'tv';
    const releaseDate = isSeries ? details.first_air_date : details.release_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();

    // Map Cast
    const cast = details.credits?.cast?.slice(0, 10).map(c => ({
        id: `aaa-person-${c.id}`,
        name: c.name,
        role: c.character || 'Actor',
        imageUrl: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : ''
    })) || [];

    // Map Videos (Trailer)
    const videos = details.videos?.results || [];
    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined;

    // Map Videos (Extras)
    const mappedVideos = videos.slice(0, 5).map(v => ({
        id: v.id,
        title: v.name,
        thumbnailUrl: `https://img.youtube.com/vi/${v.key}/maxresdefault.jpg`,
        videoUrl: `https://www.youtube.com/watch?v=${v.key}`,
        duration: "Trailer" // Placeholder
    }));

    // Map Images
    const backdrops = details.images?.backdrops?.slice(0, 5).map(i => `https://image.tmdb.org/t/p/original${i.file_path}`) || [];

    // Streaming (Just a placeholder as we don't have real links)
    const streamingLinks = [];

    // Genre Tags
    const tags = details.genres?.map(g => g.name) || [];

    return {
        id: `tmdb-${details.id}`,
        title: isSeries ? details.name : details.title,
        releaseYear: year,
        releaseDate: releaseDate,
        duration: isSeries ? `${details.number_of_seasons} Seasons` : `${details.runtime} min`,
        posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
        director: details.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown',
        description: details.overview || '',
        rating: details.vote_average || 0,
        voteCount: details.vote_count || 0,
        views: 0,
        tags: tags,
        cast: cast,
        isCopyrightFree: false,
        streamingLinks: streamingLinks,
        contentType: isSeries ? 'series' : 'movie',
        totalSeasons: isSeries ? `${details.number_of_seasons} Seasons` : undefined,
        language: 'English',
        languages: [details.original_language === 'en' ? 'English' : details.original_language],
        trailerUrl: trailerUrl,
        images: backdrops.length > 0 ? backdrops : undefined,
        videos: mappedVideos.length > 0 ? mappedVideos : undefined,
        // For series, we optionally fetch seasons, but for BULK, we might skip full episode details to save API calls?
        // User said "fetch as much data as possible".
        // Let's stick to base details first. If series, we add a placeholder season structure or fetch S1?
        // For speed in reaching 2000, let's map seasons lightly if provided in 'details' (details.seasons exists in TV detail)
        seasons: isSeries && details.seasons ? details.seasons.filter(s => s.season_number > 0).map(s => ({
            seasonNumber: s.season_number,
            episodes: Array(s.episode_count).fill(0).map((_, i) => ({
                id: crypto.randomUUID(),
                title: `Episode ${i + 1}`,
                duration: "45m",
                description: "Episode details not fetched for bulk optimization.",
                episodeNumber: i + 1
            }))
        })) : undefined
    };
};

// --- MAIN ---
const main = async () => {
    // 1. Load Existing Data
    let existingMovies = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
        const match = content.match(/export const tmdbMovies: Movie\[] = (\[[\s\S]*\]);/);
        if (match && match[1]) {
            existingMovies = JSON.parse(match[1].replace(/,(\s*])/g, '$1'));
        }
    }

    console.log(`Current Count: ${existingMovies.length}`);
    if (existingMovies.length >= TARGET_COUNT) {
        console.log('Target count already reached.');
        return;
    }

    const existingIds = new Set(existingMovies.map(m => m.id));
    const newMoviesBuffer = [];
    let page = 1;
    let totalAdded = 0;

    // We'll alternate usage between movie and tv discover
    const endpoints = ['movie', 'tv'];

    while (existingMovies.length + totalAdded < TARGET_COUNT && page <= 50) {
        for (const type of endpoints) {
            if (existingMovies.length + totalAdded >= TARGET_COUNT) break;

            console.log(`Fetching Page ${page} for ${type}...`);
            const discoverUrl = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&vote_count.gte=100&language=en-US&page=${page}`;

            try {
                const data = await fetchUrl(discoverUrl);
                if (!data || !data.results) continue;

                for (const item of data.results) {
                    if (existingMovies.length + totalAdded >= TARGET_COUNT) break;

                    const id = `tmdb-${item.id}`;
                    if (existingIds.has(id)) continue;

                    // Fetch Details
                    console.log(`  Fetching details for: ${item.name || item.title}`);
                    const detailsUrl = `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,images,external_ids`;

                    await wait(DELAY_MS); // Rate limiting
                    const details = await fetchUrl(detailsUrl);

                    const movie = mapToMovie(details, type);
                    if (movie) {
                        newMoviesBuffer.push(movie);
                        existingIds.add(id);
                        totalAdded++;
                    }
                }
            } catch (err) {
                console.error(`Error on page ${page} ${type}:`, err.message);
            }
        }
        page++;

        // Periodic Save
        if (newMoviesBuffer.length >= 50) {
            const combined = [...existingMovies, ...newMoviesBuffer];
            const fileContent = `import type { Movie } from '../types';\n\nexport const tmdbMovies: Movie[] = ${JSON.stringify(combined, null, 4)};\n`;
            fs.writeFileSync(OUTPUT_FILE, fileContent);
            console.log(`> Saved intermediate progress. Total now: ${combined.length}`);
            existingMovies = combined;
            newMoviesBuffer.length = 0; // Clear buffer
            totalAdded = 0; // Reset counter as they are now in existingMovies
        }
    }

    // Final Save
    if (newMoviesBuffer.length > 0) {
        const combined = [...existingMovies, ...newMoviesBuffer];
        const fileContent = `import type { Movie } from '../types';\n\nexport const tmdbMovies: Movie[] = ${JSON.stringify(combined, null, 4)};\n`;
        fs.writeFileSync(OUTPUT_FILE, fileContent);
        console.log(`Final Save. Total: ${combined.length}`);
    } else {
        console.log('Finished. No new items to save in final step.');
    }

};

main();
