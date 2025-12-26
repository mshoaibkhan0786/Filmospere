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
async function fetchTMDB(endpoint: string) {
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    const res = await fetch(url.toString());
    if (!res.ok) {
        if (res.status === 404) return null;
        console.warn(`TMDB Error ${res.status} for ${endpoint}`);
        return null;
    }
    return res.json();
}

async function fetchSeasonsForShow(tmdbId: number, totalSeasons: number) {
    console.log(`Fetching ${totalSeasons} seasons for ID ${tmdbId}...`);
    const seasonsData: any[] = [];

    // TMDB seasons are 0-indexed sometimes via "Specials", but usually 1-N.
    // We'll trust totalSeasons but also check season 0 (Specials) if needed?
    // Let's stick to 1..totalSeasons for now + 0 if it exists?
    // Actually, usually fetching /tv/{id} gives "seasons" array with season_number.
    // Iterating that is safer.

    // 1. Fetch Show Details to get season numbers
    const showDetails = await fetchTMDB(`/tv/${tmdbId}`);
    if (!showDetails || !showDetails.seasons) {
        console.error('Failed to fetch show details.');
        return [];
    }

    const seasonMetas = showDetails.seasons; // Array of { season_number, episode_count, ... }

    for (const sMeta of seasonMetas) {
        const sNum = sMeta.season_number;
        if (sNum === 0 && sMeta.episode_count === 0) continue; // Skip empty specials

        console.log(`  - Fetching Season ${sNum}...`);
        const sDetails = await fetchTMDB(`/tv/${tmdbId}/season/${sNum}`);

        if (!sDetails) continue;

        const episodes = sDetails.episodes?.map((e: any) => ({
            id: `tmdb-ep-${e.id}`,
            title: e.name,
            overview: e.overview,
            airDate: e.air_date,
            stillUrl: e.still_path ? `https://image.tmdb.org/t/p/original${e.still_path}` : null,
            episodeNumber: e.episode_number,
            seasonNumber: e.season_number,
            duration: e.runtime || 0,
            voteAverage: e.vote_average
        })) || [];

        seasonsData.push({
            id: `tmdb-season-${sDetails._id || sDetails.id}`,
            seasonNumber: sNum,
            title: sData.name || `Season ${sNum}`,
            overview: sDetails.overview,
            posterUrl: sDetails.poster_path ? `https://image.tmdb.org/t/p/w500${sDetails.poster_path}` : null,
            episodeCount: episodes.length,
            episodes: episodes
        });
    }

    return seasonsData;
}

// Fixed function inside the loop above
async function run() {
    console.log('🚀 Checking/Fixing Seasons...');

    const targets = [
        { id: 57911, title: 'Doraemon' },
        { id: 71446, title: 'Money Heist' }
    ];

    for (const t of targets) {
        console.log(`\nProcessing ${t.title}...`);

        // 1. Get raw seasons list from TMDB first
        const showDetails = await fetchTMDB(`/tv/${t.id}`);
        if (!showDetails) {
            console.error('Failed to find show on TMDB');
            continue;
        }

        const seasonMetas = showDetails.seasons || [];
        const fullSeasons: any[] = [];

        for (const meta of seasonMetas) {
            // Fetch detailed episodes
            console.log(`  Fetching Season ${meta.season_number} (${meta.episode_count} eps)...`);
            const sDetails = await fetchTMDB(`/tv/${t.id}/season/${meta.season_number}`);

            if (sDetails) {
                const episodes = sDetails.episodes?.map((e: any) => ({
                    id: `tmdb-ep-${e.id}`,
                    title: e.name,
                    overview: e.overview,
                    airDate: e.air_date,
                    stillUrl: e.still_path ? `https://image.tmdb.org/t/p/w500${e.still_path}` : null,
                    episodeNumber: e.episode_number,
                    seasonNumber: e.season_number,
                    duration: e.runtime || 0,
                    voteAverage: e.vote_average
                })) || [];

                fullSeasons.push({
                    id: `tmdb-s-${sDetails.id}`,
                    seasonNumber: meta.season_number,
                    title: meta.name,
                    overview: meta.overview,
                    posterUrl: meta.poster_path ? `https://image.tmdb.org/t/p/w500${meta.poster_path}` : null,
                    episodeCount: episodes.length,
                    episodes: episodes
                });
            }
        }

        // 2. Update Supabase
        const movieId = `tmdb-${t.id}`;

        // Fetch existing to preserve other fields
        const { data: existing } = await supabase.from('movies').select('data').eq('id', movieId).single();

        if (existing) {
            const newData = {
                ...existing.data,
                seasons: fullSeasons,
                totalSeasons: fullSeasons.length
            };

            const { error } = await supabase
                .from('movies')
                .update({ data: newData })
                .eq('id', movieId);

            if (!error) console.log(`✅ Updated ${t.title} with ${fullSeasons.length} seasons.`);
            else console.error(`❌ DB Error updating ${t.title}:`, error);
        } else {
            console.log(`❌ Movie record ${movieId} not found in DB.`);
        }
    }
}

run();
