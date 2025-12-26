const https = require('https');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const API_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';
const SOURCE_FILE = path.join(__dirname, '../src/data/omdbMovies.ts');
const TARGET_FILE = path.join(__dirname, '../src/data/tmdbMovies.ts');

// --- HELPERS ---

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchTmdb = (endpoint, params = {}) => {
    return new Promise((resolve, reject) => {
        const queryParams = new URLSearchParams(params).toString();
        const pathStr = `/3${endpoint}${queryParams ? '?' + queryParams : ''}`;

        const options = {
            hostname: 'api.themoviedb.org',
            path: pathStr,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_READ_ACCESS_TOKEN}`,
                'accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        // Rate limit handling (status 429)
                        if (res.statusCode === 429) {
                            console.log('    Hit rate limit (429), waiting...');
                            setTimeout(() => {
                                fetchTmdb(endpoint, params).then(resolve).catch(reject);
                            }, 2000);
                        } else {
                            // Don't reject, just resolve null for 404s etc to keep moving
                            resolve(null);
                        }
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`    Network error: ${e.message}, retrying...`);
            setTimeout(() => {
                fetchTmdb(endpoint, params).then(resolve).catch(reject);
            }, 2000);
        });

        req.end();
    });
};

const getGenreMap = async () => {
    const movieGenres = await fetchTmdb('/genre/movie/list');
    const tvGenres = await fetchTmdb('/genre/tv/list');

    const map = {};
    if (movieGenres && movieGenres.genres) {
        movieGenres.genres.forEach(g => map[g.id] = g.name);
    }
    if (tvGenres && tvGenres.genres) {
        tvGenres.genres.forEach(g => map[g.id] = g.name);
    }
    return map;
};

// --- DATA MAPPING ---

const mapTmdbToMovie = (details, credits, type, genreMap, videos, seasonDetails = []) => {
    const isSeries = type === 'tv';

    // Cast
    const cast = (credits?.cast || []).slice(0, 10).map(member => ({
        id: `aaa-person-${member.id}`,
        name: member.name,
        role: member.character || 'Actor',
        imageUrl: member.profile_path ? `https://image.tmdb.org/t/p/w200${member.profile_path}` : ''
    }));

    // Director
    let director = 'Unknown';
    if (credits?.crew) {
        const d = credits.crew.find(c => c.job === 'Director');
        if (d) director = d.name;
    }
    if (isSeries && details.created_by && details.created_by.length > 0) {
        director = details.created_by.map(c => c.name).join(', ');
    }

    // Genres
    const tags = (details.genres || []).map(g => g.name);

    // Videos (Trailer)
    let trailerUrl = '';
    const trailer = videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer');
    if (trailer) {
        trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    }

    // Seasons Mapping
    let seasons = undefined;
    if (isSeries && seasonDetails.length > 0) {
        seasons = seasonDetails.map(s => ({
            seasonNumber: s.season_number,
            episodes: (s.episodes || []).map(ep => ({
                id: `ep-${ep.id}`,
                title: ep.name,
                duration: ep.runtime ? `${ep.runtime} min` : 'N/A',
                description: ep.overview,
                thumbnailUrl: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : '',
                releaseDate: ep.air_date,
                episodeNumber: ep.episode_number
            }))
        }));
    }

    // Images (Backdrops as extra images)
    const extraImages = [];
    if (details.images && details.images.backdrops) {
        details.images.backdrops.slice(0, 5).forEach(img => {
            extraImages.push(`https://image.tmdb.org/t/p/original${img.file_path}`);
        });
    }

    return {
        id: `tmdb-${details.id}`,
        title: isSeries ? details.name : details.title,
        releaseYear: parseInt((isSeries ? details.first_air_date : details.release_date)?.split('-')[0]) || new Date().getFullYear(),
        releaseDate: isSeries ? details.first_air_date : details.release_date,
        duration: isSeries ? (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min` : 'N/A') : `${details.runtime} min`,
        posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
        director: director,
        description: details.overview,
        rating: details.vote_average || 0,
        voteCount: details.vote_count || 0,
        views: 0, // Reset views or migrate if possible (but IDs change so hard to map)
        tags: tags,
        cast: cast,
        isCopyrightFree: false,
        streamingLinks: [],
        contentType: isSeries ? 'series' : 'movie',
        totalSeasons: isSeries ? `${details.number_of_seasons} Seasons` : undefined,
        language: details.original_language === 'en' ? 'English' : 'International',
        languages: details.spoken_languages?.map(l => l.english_name) || [],
        boxOffice: details.revenue ? `$${(details.revenue / 1000000).toFixed(1)}M` : undefined,
        seasons: seasons,
        trailerUrl: trailerUrl,
        images: extraImages.length > 0 ? extraImages : (details.backdrop_path ? [`https://image.tmdb.org/t/p/original${details.backdrop_path}`] : [])
    };
};

// --- MAIN MIGRATION ---

const main = async () => {
    console.log('Starting migration to TMDB...');

    // 1. Read existing OMDB file to get Titles
    let omdbMoviesWithTitles = [];
    try {
        const content = fs.readFileSync(SOURCE_FILE, 'utf-8');
        const match = content.match(/export const omdbMovies: Movie\[] = (\[[\s\S]*\]);/);
        if (match && match[1]) {
            const jsonStr = match[1].replace(/,(\s*])/g, '$1'); // Fix trailing comma
            omdbMoviesWithTitles = JSON.parse(jsonStr);
        }
    } catch (e) {
        console.error('Failed to read source file:', e);
        return;
    }

    // Extract unique titles to fetch
    // Use a Set to avoid re-fetching same title multiple times
    const uniqueTitles = Array.from(new Set(omdbMoviesWithTitles.map(m => m.title)));
    console.log(`Found ${uniqueTitles.length} unique titles to migrate.`);

    const genreMap = await getGenreMap();
    const newMovies = [];
    const failedTitles = [];

    // Helper to find existing movie to preserve some data if needed? 
    // Actually we just want a fresh fetch to ensure clean TMDB data.

    for (let i = 0; i < uniqueTitles.length; i++) {
        const title = uniqueTitles[i];
        console.log(`[${i + 1}/${uniqueTitles.length}] Migrating: ${title}`);

        // Search
        const searchRes = await fetchTmdb('/search/multi', { query: title });

        if (searchRes && searchRes.results && searchRes.results.length > 0) {
            // Pick best match (popularity descending is default usually, but let's just pick first valid movie/tv)
            // Filter slightly to ensure we don't pick a person
            const bestMatch = searchRes.results.find(r => r.media_type === 'movie' || r.media_type === 'tv');

            if (bestMatch) {
                const type = bestMatch.media_type; // 'movie' or 'tv'

                // Fetch Details with credits, images, videos
                const appendToResponse = 'credits,images,videos'; // for seasons we need separate calls typically
                const details = await fetchTmdb(`/${type}/${bestMatch.id}`, { append_to_response: appendToResponse });

                let seasonDetails = [];
                if (type === 'tv' && details.seasons) {
                    // Fetch up to 15 seasons like before
                    const limit = Math.min(details.seasons.length, 15);
                    for (let s = 1; s <= limit; s++) {
                        // Some seasons are season 0 (specials), usually start at 1
                        const foundSeason = details.seasons.find(ds => ds.season_number === s);
                        if (foundSeason) {
                            const sData = await fetchTmdb(`/tv/${bestMatch.id}/season/${s}`);
                            if (sData) seasonDetails.push(sData);
                        }
                        await delay(100);
                    }
                }

                const movie = mapTmdbToMovie(details, details.credits, type, genreMap, details.videos, seasonDetails);
                newMovies.push(movie);
            } else {
                console.log(`   No movie/tv match found for: ${title}`);
                failedTitles.push(title);
            }
        } else {
            console.log(`   Search returned no results for: ${title}`);
            failedTitles.push(title);
        }

        // Save periodically
        if ((i + 1) % 50 === 0) {
            saveToFile(newMovies, TARGET_FILE);
        }

        await delay(100); // Rate limit buffer
    }

    saveToFile(newMovies, TARGET_FILE);
    console.log('Migration Complete.');
    console.log(`Successfully migrated: ${newMovies.length}`);
    console.log(`Failed: ${failedTitles.length}`, failedTitles);
};

const saveToFile = (movies, path) => {
    // Remove duplicates by ID just in case
    const unique = [];
    const map = new Set();
    for (const m of movies) {
        if (!map.has(m.id)) {
            map.add(m.id);
            unique.push(m);
        }
    }

    const content = `import type { Movie } from '../types';

export const tmdbMovies: Movie[] = ${JSON.stringify(unique, null, 4)};
`;
    fs.writeFileSync(path, content);
    console.log(`Saved ${unique.length} items to ${path}`);
};

main();
