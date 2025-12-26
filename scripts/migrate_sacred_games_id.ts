
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Using hardcoded token since it worked reliably last time and .env might be missing it for scripts
const tmdbToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateSacredGames() {
    const OLD_ID = 'tmdb-79352'; // Wrong (Tamil Movie?)
    const NEW_ID = 'tmdb-76479'; // Correct (Netflix Series)
    const REAL_TMDB_ID = 76479;

    console.log(`Starting migration: ${OLD_ID} -> ${NEW_ID}`);

    // 1. Fetch Old Data (to preserve AI fields)
    const { data: oldRecord, error: fetchError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', OLD_ID)
        .single();

    if (fetchError || !oldRecord) {
        console.error('Error fetching old record:', fetchError);
        return;
    }

    console.log('Found old record. Preserving AI data...');
    const oldData = oldRecord.data || {};

    // Fields to Preserve
    const preservedData = {
        whyWatch: oldRecord.whyWatch || oldData.whyWatch,
        seoDescription: oldRecord.seoDescription || oldData.seoDescription,
        keywords: oldRecord.keywords || oldData.keywords,
        metaTitle: oldRecord.metaTitle || oldData.metaTitle,
        metaDescription: oldRecord.metaDescription || oldData.metaDescription,
        // Also preserve biography if AI generated? 
        // Usually bio is part of description or seoDescription. 
        // description might be TMDB standard, seoDescription is AI.
        // We'll keep seoDescription.
    };

    // 2. Fetch New Data from TMDB (for ID 76479)
    console.log(`Fetching latest metadata for TMDB ID ${REAL_TMDB_ID}...`);

    const detailsUrl = `https://api.themoviedb.org/3/tv/${REAL_TMDB_ID}?language=en-US&append_to_response=watch/providers,credits,videos,images,external_ids`;
    const res = await fetch(detailsUrl, {
        headers: { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' }
    });

    if (!res.ok) {
        console.error('Failed to fetch from TMDB:', res.statusText);
        return;
    }

    const tmdbData = await res.json();

    // 3. Process New Data
    // Map TMDB response to our Schema (similar to fetch_tmdb_movies.js logic)

    // Streaming Links
    const providers = tmdbData['watch/providers']?.results?.IN || tmdbData['watch/providers']?.results?.US || {};
    const streamingLinks = [];
    if (providers.flatrate) {
        providers.flatrate.forEach((p: any) => streamingLinks.push({ platform: p.provider_name, url: p.link || '', type: 'flatrate', country: 'IN' }));
    }
    // Add other regions if needed, simplified for now to generic or IN priority as per previous scripts

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
        id: NEW_ID,
        tmdbId: REAL_TMDB_ID,
        title: tmdbData.name,
        originalTitle: tmdbData.original_name,
        posterUrl: tmdbData.poster_path,
        backdropUrl: tmdbData.backdrop_path,
        description: tmdbData.overview, // Standard TMDB description
        rating: tmdbData.vote_average,
        voteCount: tmdbData.vote_count,
        releaseYear: new Date(tmdbData.first_air_date).getFullYear(),
        releaseDate: tmdbData.first_air_date,
        // Language: We fix this now!
        language: tmdbData.original_language === 'hi' ? 'Hindi' : 'English', // Fallback
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

    // 4. Insert New Record
    console.log('Inserting new record...');
    const { error: insertError } = await supabase
        .from('movies')
        .upsert({ // Start with upsert to be safe
            id: NEW_ID,
            // title: newData.title,
            // Map top-level columns that mirror JSON for search
            // description: newData.description,
            // rating: newData.rating,
            // releaseYear: newData.releaseYear,
            // language: newData.language,

            // quality: 'HD', // default
            // tags: newData.genres, // genres map to tags often
            // cast: cast.map((c: any) => c.name), // flat cast array


            // Critical: The full JSON blob
            data: newData,

            // And the explicit preserved columns if they exist as columns
            // whyWatch: preservedData.whyWatch,
            // keywords: preservedData.keywords,
            // seoDescription: preservedData.seoDescription,
            // metaTitle: preservedData.metaTitle,
            // metaDescription: preservedData.metaDescription

        });

    if (insertError) {
        console.error('Insert Failed:', insertError);
        return;
    }

    console.log('New record inserted successfully.');

    // 5. Delete Old Record
    console.log('Deleting old record...');
    const { error: deleteError } = await supabase
        .from('movies')
        .delete()
        .eq('id', OLD_ID);

    if (deleteError) {
        console.error('Delete Failed:', deleteError);
    } else {
        console.log(`Migration Complete! Swapped ${OLD_ID} with ${NEW_ID}.`);
    }
}

migrateSacredGames();
