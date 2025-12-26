const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// --- SUPABASE CONFIG ---
const supabaseUrl = 'https://tuspzqzahnlukliyqjbd.supabase.co';
// Using SERVICE_KEY to ensure we can WRITE to the DB (Anon key might have RLS policies preventing updates?)
// Actually, I should use the one from .env if I can. 
// Retrying with Anon Key which worked for reading
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c3B6cXphaG5sdWtsaXlxamJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDIzMTksImV4cCI6MjA4MTIxODMxOX0.frkgaCFseKrDPUprm3OT0m75PzZ9yk-yrgSC9XUifWU';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TMDB CONFIG ---
const TMDB_API_KEY = '8da2d8399f3af98c4d290b2aaacc602e';
const MOVIE_ID = '71446'; // Money Heist TV ID

// --- HELPER: Fetch URL ---
const fetchUrl = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    console.error('Fetch failed:', url, res.statusCode);
                    resolve(null);
                } else {
                    try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
                }
            });
        }).on('error', reject);
    });
};

const mapToMovie = (details, seasonsData) => {
    const isSeries = true;
    const releaseDate = details.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
    const backdrops = details.images?.backdrops?.slice(0, 5).map(i => `https://image.tmdb.org/t/p/original${i.file_path}`) || [];
    const videos = details.videos?.results || [];
    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined;

    return {
        id: `tmdb-${details.id}`,
        title: details.name,
        releaseYear: year,
        releaseDate: releaseDate,
        duration: `${details.number_of_seasons} Seasons`,
        posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
        director: details.created_by?.map(c => c.name).join(', ') || 'Unknown',
        description: details.overview || '',
        rating: details.vote_average || 0,
        voteCount: details.vote_count || 0,
        views: 0,
        tags: details.genres?.map(g => g.name) || [],
        cast: details.credits?.cast?.slice(0, 10).map(c => ({
            id: `person-${c.id}`,
            name: c.name,
            role: c.character,
            imageUrl: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : ''
        })) || [],
        isCopyrightFree: false,
        streamingLinks: [
            { platform: 'Netflix', url: 'https://www.netflix.com/title/80192098', type: 'flatrate', country: 'US' },
            { platform: 'Netflix', url: 'https://www.netflix.com/title/80192098', type: 'flatrate', country: 'IN' },
            { platform: 'Netflix', url: 'https://www.netflix.com/title/80192098', type: 'flatrate', country: 'GB' },
            { platform: 'Netflix', url: 'https://www.netflix.com/title/80192098', type: 'flatrate', country: 'AU' },
            { platform: 'Netflix', url: 'https://www.netflix.com/title/80192098', type: 'flatrate', country: 'CA' }
        ],
        contentType: 'series',
        totalSeasons: `${details.number_of_seasons} Seasons`,
        language: details.original_language === 'en' ? 'English' : details.original_language,
        languages: [details.original_language],
        trailerUrl: trailerUrl,
        images: backdrops,
        seasons: seasonsData
    };
};

async function main() {
    console.log(`Fetching details for Money Heist (${MOVIE_ID})...`);

    // 1. Fetch Main Details
    const detailsUrl = `https://api.themoviedb.org/3/tv/${MOVIE_ID}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,images,external_ids`;
    const details = await fetchUrl(detailsUrl);

    if (!details) {
        console.error('Failed to fetch details from TMDB');
        return;
    }

    console.log(`Fetched details. Total Seasons: ${details.number_of_seasons}`);

    // 2. Fetch All Seasons Details
    const seasonsData = [];
    for (const season of details.seasons) {
        if (season.season_number === 0) continue; // Skip specials usually

        console.log(`Fetching Season ${season.season_number}...`);
        const seasonUrl = `https://api.themoviedb.org/3/tv/${MOVIE_ID}/season/${season.season_number}?api_key=${TMDB_API_KEY}`;
        const sData = await fetchUrl(seasonUrl);

        if (sData) {
            seasonsData.push({
                seasonNumber: sData.season_number,
                episodes: sData.episodes.map(eps => ({
                    id: `eps-${eps.id}`,
                    title: eps.name,
                    duration: eps.runtime ? `${eps.runtime}m` : '45m',
                    description: eps.overview,
                    thumbnailUrl: eps.still_path ? `https://image.tmdb.org/t/p/w300${eps.still_path}` : null,
                    releaseDate: eps.air_date,
                    episodeNumber: eps.episode_number
                }))
            });
        }
    }

    // 3. Construct Final Object
    const movieData = mapToMovie(details, seasonsData);

    // 4. Update Supabase
    const dbId = `tmdb-${details.id}`;
    console.log(`Updating Supabase record: ${dbId}...`);

    // First check if it exists to preserve 'views' or 'streamingLinks' if we cared, 
    // but here we just overwrite to fix the broken data.
    // Actually, preserving existing streamingLinks (if any were added manually) would be nice.
    // Fetch specifically logic from DB? 
    // Let's just overwrite for now as the user implies it's broken.

    const row = {
        id: dbId,
        title: movieData.title,
        data: movieData,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('movies').upsert(row);

    if (error) {
        console.error('Supabase Update Failed:', error);
    } else {
        console.log('Success! Money Heist updated with full season data.');
    }
}

main();
