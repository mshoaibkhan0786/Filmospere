require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';
const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchTMDB(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${TMDB_READ_TOKEN}`,
            accept: 'application/json'
        }
    });
    if (!res.ok) return null;
    return res.json();
}

const isRecentDate = (dateStr, year) => {
    if (!dateStr) {
        if (year === 2025 || year === 2026) return true;
        return false;
    }
    // Check if between Dec 1 2025 and Mar 31 2026
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    
    const start = new Date('2025-12-01');
    const end = new Date('2026-03-31');
    return d >= start && d <= end;
};

// Helper to format revenue cleanly like standard DB entries
const formatRevenue = (rev) => {
    if (!rev) return null;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rev);
};

// Simple duration formatter for missing duration
const formatDuration = (min) => {
    if (!min) return null;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

async function run(dryRun = true) {
    console.log(`Starting Data Update... Dry Run: ${dryRun}`);
    
    // 1. Fetch all movies that might fit the criteria
    // Since we can't easily filter JSON releaseDate inside supabase range, we fetch 2025 and 2026 movies
    console.log('Fetching 2025 and 2026 movies from Supabase...');
    const { data: moviesReq1, error: err1 } = await supabase.from('movies').select('id, data').eq('data->>releaseYear', '2025');
    const { data: moviesReq2, error: err2 } = await supabase.from('movies').select('id, data').eq('data->>releaseYear', '2026');
    
    if (err1 || err2) {
        console.error('Failed to fetch movies:', err1 || err2);
        return;
    }
    
    const allCandidates = [...(moviesReq1 || []), ...(moviesReq2 || [])];
    const targetMovies = allCandidates.filter(m => m.data && isRecentDate(m.data.releaseDate, m.data.releaseYear));
    
    console.log(`Found ${targetMovies.length} movies between Dec 2025 and Mar 2026.`);
    
    let updatedCount = 0;

    for (let i = 0; i < targetMovies.length; i++) {
        const item = targetMovies[i];
        const currentData = item.data;
        const contentType = currentData.contentType || 'movie';
        
        // Extract TMDB ID
        let tmdbId = item.id.replace('tmdb-', '');
        if (!tmdbId.match(/^\d+$/)) {
            const possibleId = currentData.id?.toString().replace('tmdb-', '');
            if (possibleId && possibleId.match(/^\d+$/)) tmdbId = possibleId;
            else {
                console.log(`[Skip] Cannot find TMDB ID for ${currentData.title} (${item.id})`);
                continue;
            }
        }

        const endpoint = contentType === 'series' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
        const tmdbData = await fetchTMDB(endpoint);
        
        if (!tmdbData) {
            console.log(`[Skip] TMDB Lookup failed for ${currentData.title} (${item.id})`);
            continue;
        }

        let updated = false;
        let changes = [];

        // 1. UPDATE RELEASE STATUS 
        if (tmdbData.status && currentData.status !== tmdbData.status) {
            currentData.status = tmdbData.status;
            changes.push(`status -> ${tmdbData.status}`);
            updated = true;
        }

        // 2. UPDATE BOX OFFICE (Movies only)
        if (contentType === 'movie' && tmdbData.revenue && tmdbData.revenue > 0) {
            const revStr = formatRevenue(tmdbData.revenue);
            const currRev = currentData.boxOffice || currentData.revenue; // Some use boxOffice, some use revenue
            if (currRev !== revStr) {
                currentData.boxOffice = revStr; // standardize on boxOffice
                changes.push(`boxOffice -> ${revStr}`);
                updated = true;
            }
        }
        
        // 3. UPDATE RATING/VOTE COUNT (Always safe to sync)
        if (tmdbData.vote_average && tmdbData.vote_count) {
             const newRating = parseFloat(tmdbData.vote_average.toFixed(1));
             if (currentData.rating !== newRating || currentData.voteCount !== tmdbData.vote_count) {
                 if (tmdbData.vote_count > (currentData.voteCount || 0)) {
                    currentData.rating = newRating;
                    currentData.voteCount = tmdbData.vote_count;
                    changes.push(`ratings -> ${newRating} (${tmdbData.vote_count} votes)`);
                    updated = true;
                 }
             }
        }

        // 4. FILL MISSING INFORMATION Gaps (ONLY IF MISSING!)
        if (!currentData.duration && tmdbData.runtime) {
            currentData.duration = formatDuration(tmdbData.runtime);
            changes.push(`duration -> ${currentData.duration}`);
            updated = true;
        } else if (!currentData.duration && tmdbData.episode_run_time && tmdbData.episode_run_time[0]) {
            currentData.duration = formatDuration(tmdbData.episode_run_time[0]);
            changes.push(`duration -> ${currentData.duration}`);
            updated = true;
        }
        
        // ONLY update certification if it's completely missing
        if (!currentData.certification && contentType === 'movie') {
            const releases = await fetchTMDB(`/movie/${tmdbId}/release_dates`);
            if (releases && releases.results) {
                const usRelease = releases.results.find(r => r.iso_3166_1 === 'US');
                if (usRelease && usRelease.release_dates[0].certification) {
                    currentData.certification = usRelease.release_dates[0].certification;
                    changes.push(`certification -> ${currentData.certification}`);
                    updated = true;
                }
            }
        }

        if (updated) {
            console.log(`[Update] ${currentData.title} (${item.id}) | Changes: ${changes.join(', ')}`);
            if (!dryRun) {
                const { error } = await supabase.from('movies').update({ data: currentData }).eq('id', item.id);
                if (error) console.error(`   Failed to save ${item.id}:`, error.message);
                else updatedCount++;
            }
        }
        
        await new Promise(r => setTimeout(r, 100)); // Sleep to respect TMDB ratelimiting
    }
    
    console.log(`\nDONE! Processed ${targetMovies.length} movies.`);
    if (dryRun) {
        console.log(`[DRY RUN] Would have updated ${updatedCount} records. Run script with arg 'live' to execute.`);
    } else {
        console.log(`[LIVE] Successfully updated ${updatedCount} records in the database.`);
    }
}

const isLive = process.argv.includes('live');
run(!isLive).catch(e => { console.error("FATAL ERROR", e); process.exit(1); });
