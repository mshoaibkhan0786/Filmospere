// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// CONFIGURATION
const TMDB_API_KEY = process.env.TMDB_API_KEY || '8da2d8399f3af98c4d290b2aaacc602e';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// Helpers
async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
    }
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    return res.json();
}

function getProviderLogo(logoPath: string) {
    if (!logoPath) return undefined;
    return `https://image.tmdb.org/t/p/original${logoPath}`;
}

function mapStreamingLinks(providers: any) {
    const links: any[] = [];
    const regions = [
        { code: 'US', label: 'US' },
        { code: 'GB', label: 'GB' },
        { code: 'IN', label: 'IN' },
        { code: 'AU', label: 'AU' },
        { code: 'CA', label: 'CA' }
    ];

    for (const region of regions) {
        const data = providers?.results?.[region.code];
        if (!data) continue;

        const sources = [
            ...(data.flatrate || []),
            ...(data.free || []),
            ...(data.ads || []),
            ...(data.rent || []),
            ...(data.buy || [])
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

async function processAndInsert(tmdbId: number, type: 'movie' | 'tv') {
    console.log(`Fetching details for ID: ${tmdbId} (${type})...`);

    // 1. Fetch Details with extras
    const endpoint = type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const details = await fetchTMDB(endpoint, {
        append_to_response: 'credits,videos,images,watch/providers,release_dates,content_ratings'
    });

    if (!details) {
        console.error(`Failed to fetch details for ${tmdbId}`);
        return;
    }

    // 2. Map Data
    const streamingLinks = mapStreamingLinks(details['watch/providers']);

    // Certification
    let certification = '';
    if (type === 'movie') {
        const releases = details.release_dates?.results || [];
        const target = releases.find((r: any) => r.iso_3166_1 === 'US') || releases.find((r: any) => r.iso_3166_1 === 'IN');
        if (target) certification = target.release_dates.find((d: any) => d.certification)?.certification || '';
    } else {
        const ratings = details.content_ratings?.results || [];
        const target = ratings.find((r: any) => r.iso_3166_1 === 'US') || ratings.find((r: any) => r.iso_3166_1 === 'IN');
        if (target) certification = target.rating || '';
    }

    // Trailer
    const videos = details.videos?.results || [];
    const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';

    const slug = (details.title || details.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const movie: any = {
        id: `tmdb-${details.id}`,
        slug: slug || `tmdb-${details.id}`,
        title: details.title || details.name,
        originalTitle: details.original_title || details.original_name,
        tagline: details.tagline,
        description: details.overview,
        releaseYear: new Date(details.release_date || details.first_air_date).getFullYear() || 0,
        releaseDate: details.release_date || details.first_air_date,
        posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
        rating: details.vote_average,
        voteCount: details.vote_count,
        views: Math.floor(details.popularity * 1000),
        status: details.status,
        languages: details.spoken_languages?.map((l: any) => l.name) || [],
        cast: details.credits?.cast?.slice(0, 10).map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
            role: c.character,
            imageUrl: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null
        })) || [],
        streamingLinks,
        certification,
        trailerUrl,
        contentType: type === 'tv' ? 'series' : 'movie',
        tags: details.genres?.map((g: any) => g.name) || [],
        hiddenTags: [],
        images: details.images?.backdrops?.map((i: any) => `https://image.tmdb.org/t/p/original${i.file_path}`).slice(0, 5) || [],
        videos: videos.map((v: any) => ({
            id: v.id,
            title: v.name,
            thumbnailUrl: `https://img.youtube.com/vi/${v.key}/0.jpg`,
            videoUrl: `https://www.youtube.com/watch?v=${v.key}`,
            duration: '0:00'
        })).slice(0, 5)
    };

    if (type === 'tv') {
        movie.totalSeasons = details.number_of_seasons;
    } else {
        movie.budget = details.budget > 0 ? `$${(details.budget / 1000000).toFixed(1)}M` : undefined;
        movie.boxOffice = details.revenue > 0 ? `$${(details.revenue / 1000000).toFixed(1)}M` : undefined;
        movie.duration = `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`;
    }

    // 3. Insert/Upsert
    const { error } = await supabase
        .from('movies')
        .upsert({
            id: movie.id,
            title: movie.title,
            data: movie
        });

    if (error) console.error(`Error saving ${movie.title}:`, error);
    else console.log(`✅ Saved: ${movie.title} (${movie.releaseYear})`);
}

async function run() {
    console.log('Searching and Fetching Missing Content...');

    // 1. Money Heist (La Casa de Papel) - TV Series
    const moneyHeist = await fetchTMDB('/search/tv', { query: 'La Casa de Papel' });
    if (moneyHeist?.results?.[0]) {
        await processAndInsert(moneyHeist.results[0].id, 'tv');
    }

    // 2. Doraemon - TV Series
    const doraemonTV = await fetchTMDB('/search/tv', { query: 'Doraemon' });
    if (doraemonTV?.results?.[0]) {
        await processAndInsert(doraemonTV.results[0].id, 'tv');
    }

    // 3. Doraemon - Movies (Top 3)
    const doraemonMovies = await fetchTMDB('/search/movie', { query: 'Doraemon' });
    if (doraemonMovies?.results) {
        for (const m of doraemonMovies.results.slice(0, 3)) {
            await processAndInsert(m.id, 'movie');
        }
    }
}

run();
