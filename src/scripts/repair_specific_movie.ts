// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { TMDB } from 'tmdb-ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();
// Try multiple common names for TMDB token
const tmdbToken = (process.env.VITE_TMDB_ACCESS_TOKEN || process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_READ_TOKEN || '').trim();

if (!supabaseUrl || !supabaseKey || !tmdbToken) {
    console.error('❌ Missing Credentials in .env');
    console.error('Need: VITE_SUPABASE_URL, ANON/SERVICE KEY, and TMDB_ACCESS_TOKEN');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

const tmdb = new TMDB(tmdbToken);

async function repairMovie(titleQuery: string) {
    console.log(`\n🔧 Starting Repair for: "${titleQuery}"`);

    // 1. Find the movie in our DB first (to get the ID if possible, or just search TMDB directly)
    // Actually best to search TMDB to get fresh data
    console.log(`Searching TMDB for "${titleQuery}"...`);

    // We can use the search endpoint
    // Note: tmdb-ts search types might vary, usually it's tmdb.search.movies
    // Let's assume standard TMDB fetch

    try {
        const searchResults = await tmdb.search.movies({ query: titleQuery });

        if (!searchResults.results || searchResults.results.length === 0) {
            console.error('❌ Movie not found on TMDB.');
            return;
        }

        const bestMatch = searchResults.results[0]; // Take top result
        console.log(`✅ Found TMDB Match: ${bestMatch.title} (ID: ${bestMatch.id}, Year: ${bestMatch.release_date?.substring(0, 4)})`);

        // 2. Fetch Full Details
        const details = await tmdb.movies.details(bestMatch.id, ['credits', 'images', 'videos', 'keywords', 'release_dates', 'external_ids', 'watch/providers']);

        // 3. Construct Correct Data Object (matching your app's schema)
        const directors = details.credits?.crew?.filter(c => c.job === 'Director').map(d => d.name) || [];
        const cast = details.credits?.cast?.slice(0, 10).map(c => ({
            id: c.id,
            name: c.name,
            character: c.character,
            profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
        })) || [];

        const videos = details.videos?.results?.filter(v => v.site === 'YouTube').map(v => ({
            id: v.id,
            key: v.key,
            name: v.name,
            type: v.type
        })) || [];

        const images = details.images?.backdrops?.slice(0, 10).map(i => `https://image.tmdb.org/t/p/original${i.file_path}`) || [];

        // construct object
        const movieData = {
            id: `tmdb-${details.id}`, // Ensure ID format matches
            tmdbId: details.id,
            title: details.title,
            description: details.overview, // CRITICAL FIX: Ensure this is populated
            tagline: details.tagline,
            posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
            backdropUrl: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : null,
            releaseDate: details.release_date,
            releaseYear: details.release_date ? parseInt(details.release_date.split('-')[0]) : null,
            runtime: details.runtime,
            rating: details.vote_average,
            voteCount: details.vote_count,
            genres: details.genres?.map(g => g.name) || [],
            tags: details.keywords?.keywords?.map(k => k.name) || [],
            cast: cast,
            director: directors.join(', '),
            videos: videos,
            images: images,
            // Add other fields as necessary based on your schema
            contentType: 'movie',
            slug: details.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            isOptimized: false, // Reset optimization so AI fixes it later properly

            // Hardcoded fixes for common missing fields
            language: details.original_language,
            status: details.status
        };

        if (!movieData.description) {
            console.warn('⚠️ Warning: TMDB Overview is empty. Using Tagline or Placeholder.');
            movieData.description = movieData.tagline || 'No description available.';
        }

        // 4. Upsert into Supabase
        console.log('💾 Saving to Database...');

        // We need to upsert into 'movies' table. 
        // Assuming schema: id (text prime key), data (jsonb)

        // Check if exists first to preserve some fields? 
        // No, user wants to FIX empty pages. Overwrite is safer.

        const { error: upsertError } = await supabase
            .from('movies')
            .upsert({
                id: movieData.id,
                data: movieData
            });

        if (upsertError) {
            console.error('❌ Failed to save:', upsertError);
        } else {
            console.log(`✅ Successfully Repaired "${movieData.title}"!`);
            console.log(`   Description Length: ${movieData.description.length}`);
            console.log(`   Images Count: ${movieData.images.length}`);
        }

    } catch (err) {
        console.error('Crash:', err);
    }
}

// Read args
const target = process.argv[2];
if (!target) {
    console.log('Usage: npx tsx src/scripts/repair_specific_movie.ts "Movie Title"');
} else {
    repairMovie(target);
}
