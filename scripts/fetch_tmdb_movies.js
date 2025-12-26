import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';

const TARGET_COUNT = 5000;
const OUTPUT_FILE = path.resolve(__dirname, '../src/data/tmdbMovies.json');
const CONCURRENCY = 15;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getIndustryFromLang(lang) {
    const code = lang.toLowerCase();
    const map = {
        'hi': 'Bollywood',
        'te': 'Tollywood',
        'ta': 'Kollywood',
        'ml': 'Mollywood',
        'kn': 'Sandalwood',
        'en': 'Hollywood',
        'pa': 'Pollywood',
        'bn': 'Bengali Cinema',
        'mr': 'Marathi Cinema',
        'ko': 'K-Drama',
        'ja': 'Anime',
        'zh': 'Chinese Cinema',
        'es': 'Spanish Cinema',
        'fr': 'French Cinema'
    };
    return map[code] || null;
}

async function fetchJson(url) {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_READ_TOKEN}`
        }
    };
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            if (res.status === 429) {
                const retryAfter = res.headers.get('retry-after');
                const wait = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
                console.warn(`Rate limited. Waiting ${wait}ms...`);
                await sleep(wait);
                return fetchJson(url);
            }
            return null;
        }
        return await res.json();
    } catch (err) {
        return null;
    }
}

async function processCandidate(candidate, existingIds) {
    if (existingIds.has(candidate.id)) return null;

    const detailsUrl = `https://api.themoviedb.org/3/movie/${candidate.id}?append_to_response=credits,videos`;
    const details = await fetchJson(detailsUrl);
    if (!details) return null;

    const director = details.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown';
    const cast = details.credits?.cast?.slice(0, 10).map(c => ({
        id: `cast-${c.id}`,
        name: c.name,
        role: c.character || 'Actor',
        imageUrl: c.profile_path ? `https://image.tmdb.org/t/p/w500${c.profile_path}` : undefined
    })) || [];

    const videos = details.videos?.results || [];
    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');
    const movieVideos = videos.filter(v => v.site === 'YouTube').slice(0, 5).map(v => ({
        id: v.key,
        title: v.name,
        thumbnailUrl: `https://img.youtube.com/vi/${v.key}/hqdefault.jpg`,
        videoUrl: `https://www.youtube.com/watch?v=${v.key}`,
        duration: 'N/A'
    }));

    const tags = details.genres?.map(g => g.name) || [];

    // Add Industry Tag
    const lang = details.original_language?.toLowerCase() || 'en';
    const industry = getIndustryFromLang(lang);
    if (industry && !tags.includes(industry)) {
        tags.push(industry);
    }

    const formatMoney = (amount) => amount > 0 ? `$${(amount / 1000000).toFixed(1)}M` : 'N/A';

    return {
        id: `tmdb-${details.id}`,
        title: details.title,
        releaseYear: details.release_date ? parseInt(details.release_date.split('-')[0]) : 0,
        releaseDate: details.release_date,
        duration: `${details.runtime || 0} min`,
        posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
        director: director,
        description: details.overview || '',
        rating: details.vote_average || 0,
        voteCount: details.vote_count || 0,
        views: Math.floor(Math.random() * 1000),
        tags: tags,
        cast: cast,
        trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,
        videoUrl: undefined,
        streamingLinks: [],
        isCopyrightFree: false,
        language: lang.toUpperCase(),
        budget: formatMoney(details.budget),
        boxOffice: formatMoney(details.revenue),
        images: [
            details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : null,
            details.poster_path ? `https://image.tmdb.org/t/p/original${details.poster_path}` : null
        ].filter(Boolean),
        videos: movieVideos,
        contentType: 'movie'
    };
}

async function main() {
    console.log('Reading existing movies...');
    let existingMovies = [];
    try {
        const data = await fs.readFile(OUTPUT_FILE, 'utf-8');
        existingMovies = JSON.parse(data);
    } catch (e) { }

    // Backfill Industry Tags for existing
    console.log('Backfilling industry tags...');
    existingMovies.forEach(m => {
        const lang = m.language ? m.language.toLowerCase() : 'en';
        const industry = getIndustryFromLang(lang);
        if (industry && m.tags && !m.tags.includes(industry)) {
            m.tags.push(industry);
        }
    });

    const existingIds = new Set(existingMovies.map(m => {
        if (m.id.startsWith('tmdb-')) return parseInt(m.id.replace('tmdb-', ''));
        return m.id;
    }));

    console.log(`Current: ${existingMovies.length}. Target: ${TARGET_COUNT}`);
    let needed = TARGET_COUNT - existingMovies.length;
    if (needed <= 0) {
        // Even if target reached, safer to save backfilled tags
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(existingMovies, null, 4));
        return console.log('Target reached. Backfilled tags only.');
    }

    // Cycle through Indian languages
    const manualLanguages = ['hi', 'te', 'ta', 'ml', 'kn', 'bn', 'mr', 'pa'];
    let page = 1;
    let langIndex = 0;

    const addedNames = [];
    let saveCounter = 0;

    while (existingMovies.length < TARGET_COUNT) {
        const lang = manualLanguages[langIndex % manualLanguages.length];

        const discoverUrl = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=${Math.ceil(page / manualLanguages.length) + 1}&with_original_language=${lang}&sort_by=vote_count.desc&vote_count.gte=10`;

        const data = await fetchJson(discoverUrl);

        if (data && data.results && data.results.length > 0) {
            const candidates = data.results.filter(c => !existingIds.has(c.id));

            for (let i = 0; i < candidates.length; i += CONCURRENCY) {
                const chunk = candidates.slice(i, i + CONCURRENCY);
                const results = await Promise.all(chunk.map(c => processCandidate(c, existingIds)));

                for (const movie of results) {
                    if (movie) {
                        existingMovies.push(movie);
                        existingIds.add(parseInt(movie.id.replace('tmdb-', '')));
                        addedNames.push(movie.title);
                        saveCounter++;
                    }
                }

                process.stdout.write(`\rTotal: ${existingMovies.length}/${TARGET_COUNT} (+${addedNames.length}) [Current: ${lang.toUpperCase()}]`);
                if (existingMovies.length >= TARGET_COUNT) break;
            }
        }

        if (saveCounter >= 50) {
            await fs.writeFile(OUTPUT_FILE, JSON.stringify(existingMovies, null, 4));
            saveCounter = 0;
        }

        langIndex++;
        if (langIndex % manualLanguages.length === 0) {
            page++;
        }

        if (page > 1000) break;
    }

    console.log('\nFinal Save...');
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(existingMovies, null, 4));
    console.log('\nLast 50 Added:', addedNames.slice(-50).join(', '));
}

main();
