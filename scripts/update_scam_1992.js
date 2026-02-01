
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Init Supabase with SERVICE KEY for formatting/writing
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// TMDB Config
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/original';

async function fetchTMDB(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${TMDB_READ_TOKEN}`,
            accept: 'application/json'
        }
    });
    if (!res.ok) throw new Error(`TMDB Error ${res.status}: ${res.statusText}`);
    return res.json();
}

async function updateScam1992() {
    try {
        console.log('Fetching live data from TMDB for Scam 1992 (ID 111188)...');

        // 1. Fetch Main Data + Credits + Images
        const mainData = await fetchTMDB('/tv/111188?append_to_response=credits,images,external_ids,keywords');

        // 2. Fetch Season 1 (since it's a series)
        const season1 = await fetchTMDB('/tv/111188/season/1');

        console.log('Formatting data to match Gold Standard...');

        // CAST FORMATTING (Partial Paths for Image, tmdb-person-ID)
        const cast = (mainData.credits.cast || []).slice(0, 20).map(c => ({
            id: `tmdb-person-${c.id}`,
            name: c.name,
            role: c.character,
            imageUrl: c.profile_path // Keep partial as per Green Book schema
        }));

        // EPISODES FORMATTING
        const episodes = (season1.episodes || []).map(e => ({
            id: `ep-${e.id}`,
            title: e.name,
            duration: e.runtime ? `${e.runtime} min` : '50 min',
            description: e.overview,
            releaseDate: e.air_date,
            thumbnailUrl: e.still_path ? `${IMG_BASE}${e.still_path}` : null, // Full URL for thumbnails
            episodeNumber: e.episode_number
        }));

        // GENERAL IMAGES
        const safePoster = mainData.poster_path ? `${IMG_BASE}${mainData.poster_path}` : '';
        const safeBackdrop = mainData.backdrop_path ? `${IMG_BASE}${mainData.backdrop_path}` : '';
        const extraImages = (mainData.images.backdrops || [])
            .slice(0, 5)
            .map(img => `${IMG_BASE}${img.file_path}`);

        // CONSTRUCT FINAL OBJECT
        const finalData = {
            id: 'tmdb-111188',
            slug: 'scam-1992-the-harshad-mehta-story-2020', // Persist slug
            title: mainData.name || 'Scam 1992: The Harshad Mehta Story',
            originalTitle: mainData.original_name,
            description: mainData.overview,
            releaseDate: mainData.first_air_date,
            releaseYear: mainData.first_air_date ? parseInt(mainData.first_air_date.split('-')[0]) : 2020,
            status: mainData.status,
            rating: mainData.vote_average,
            voteCount: mainData.vote_count,
            duration: (mainData.episode_run_time && mainData.episode_run_time[0])
                ? formatDuration(mainData.episode_run_time[0])
                : '50m',
            language: mainData.original_language === 'hi' ? 'Hindi' : 'English',
            languages: ['Hindi'], // Hardcoded to be safe/accurate
            productionCompanies: (mainData.production_companies || []).map(c => c.name),
            keywords: (mainData.keywords?.results || []).map(k => k.name).join(', '),
            tags: (mainData.genres || []).map(g => g.name),

            // IMAGES
            posterUrl: safePoster,
            backdropUrl: safeBackdrop,
            images: extraImages.length > 0 ? extraImages : [safeBackdrop],

            // CAST
            cast: cast,

            // SEASONS
            totalSeasons: `${mainData.number_of_seasons} Seasons`,
            seasons: [{
                seasonNumber: 1,
                episodes: episodes
            }],

            // META
            contentType: 'series',
            isOptimized: true,
            isCopyrightFree: false,
            director: (mainData.created_by || []).map(c => c.name).join(', ') || 'Hansal Mehta',

            // EXTRAS from previous manual data to keep it rich
            whyWatch: [
                "📈 Captivating exploration of the stock market's dark side.",
                "🎭 Stellar performances that bring complex characters to life.",
                "📰 Based on real events, offering a riveting insight into India’s financial history."
            ],
            metaTitle: "Scam 1992: The Harshad Mehta Story - A Compelling Tale",
            metaDescription: "Discover the gripping tale of Harshad Mehta and his rise in Bombay's financial world."
        };

        console.log('--- COPIABLE JSON START ---');
        console.log(JSON.stringify(finalData, null, 2));
        console.log('--- COPIABLE JSON END ---');

    } catch (e) {
        console.error('FAILED:', e);
    }
}

// Simple Helper
function formatDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

updateScam1992();
