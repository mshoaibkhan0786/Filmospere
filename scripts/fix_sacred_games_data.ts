
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const tmdbToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSacredGamesData() {
    const TARGET_ID = 'tmdb-79352'; // The existing DB ID
    const CORRECT_TMDB_ID = 76479;  // The correct TMDB ID (Netflix)

    console.log(`Fixing data for ${TARGET_ID} using TMDB ID ${CORRECT_TMDB_ID}...`);

    // 1. Fetch Existing Data (to preserve AI fields)
    const { data: record, error: fetchError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', TARGET_ID)
        .single();

    if (fetchError || !record) {
        console.error('Error fetching record:', fetchError);
        return;
    }

    const oldData = record.data || {};

    // Fields to Preserve
    const preservedData = {
        whyWatch: record.whyWatch || oldData.whyWatch,
        seoDescription: record.seoDescription || oldData.seoDescription,
        keywords: record.keywords || oldData.keywords,
        metaTitle: record.metaTitle || oldData.metaTitle,
        metaDescription: record.metaDescription || oldData.metaDescription,
    };

    // 2. Fetch Correct Data from TMDB
    const detailsUrl = `https://api.themoviedb.org/3/tv/${CORRECT_TMDB_ID}?language=en-US&append_to_response=watch/providers,credits,videos,images,external_ids`;
    const res = await fetch(detailsUrl, {
        headers: { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' }
    });

    if (!res.ok) {
        console.error('Failed to fetch from TMDB:', res.statusText);
        return;
    }

    const tmdbData = await res.json();

    // 3. Process New Data
    const providers = tmdbData['watch/providers']?.results?.IN || tmdbData['watch/providers']?.results?.US || {};
    const streamingLinks = [];
    if (providers.flatrate) {
        providers.flatrate.forEach((p: any) => streamingLinks.push({ platform: p.provider_name, url: p.link || '', type: 'flatrate', country: 'IN' }));
    }

    const directors = tmdbData.created_by?.map((c: any) => c.name).join(', ') || 'Unknown Director';

    const cast = tmdbData.credits?.cast?.slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name,
        role: c.character,
        image: c.profile_path ? c.profile_path : null
    })) || [];

    const videos = tmdbData.videos?.results?.map((v: any) => ({
        id: v.key,
        title: v.name,
        type: v.type,
        site: v.site
    })) || [];

    const trailer = videos.find((v: any) => v.type === 'Trailer') || videos[0];

    const newData = {
        id: TARGET_ID,        // KEEP the DB ID
        tmdbId: CORRECT_TMDB_ID, // FIX the internal TMDB ID
        title: tmdbData.name,
        originalTitle: tmdbData.original_name,
        posterUrl: tmdbData.poster_path,
        backdropUrl: tmdbData.backdrop_path,
        description: tmdbData.overview,
        rating: tmdbData.vote_average,
        voteCount: tmdbData.vote_count,
        releaseYear: new Date(tmdbData.first_air_date).getFullYear(),
        releaseDate: tmdbData.first_air_date,
        language: tmdbData.original_language === 'hi' ? 'Hindi' : 'English',
        languages: tmdbData.spoken_languages?.map((l: any) => l.english_name) || [],
        genres: tmdbData.genres?.map((g: any) => g.name) || [],
        runtime: tmdbData.episode_run_time?.[0] || 0,
        status: tmdbData.status,
        contentType: 'series',
        totalSeasons: tmdbData.number_of_seasons,
        totalEpisodes: tmdbData.number_of_episodes,
        director: directors,
        cast: cast,
        videos: videos,
        trailerUrl: trailer ? trailer.id : null,
        streamingLinks: streamingLinks,

        // --- INJECT PRESERVED DATA ---
        ...preservedData
    };

    // 4. Update Record (Update data column ONLY)
    const { error: updateError } = await supabase
        .from('movies')
        .update({
            data: newData,
            // We assume top-level columns like 'title' might exist or not, 
            // but previous scripts failed on them being missing.
            // Safest: Update ONLY 'data'. 
            // If 'title' etc exist and rely on syncing, this might desync them if triggers don't handle it.
            // But getting the data right in JSON is priority 1 which powers the site detail view.
        })
        .eq('id', TARGET_ID);

    if (updateError) {
        console.error('Update Failed:', updateError);
    } else {
        console.log(`Successfully updated Sacred Games (${TARGET_ID}) with correct metadata (ID ${CORRECT_TMDB_ID}).`);
        console.log('Streaming Links:', newData.streamingLinks);
    }
}

fixSacredGamesData();
