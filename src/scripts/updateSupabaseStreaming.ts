// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// CONFIGURATION
const TMDB_API_KEY = process.env.TMDB_API_KEY || '8da2d8399f3af98c4d290b2aaacc602e';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// --- Helpers ---
async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
    }

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            if (response.status === 429) {
                console.warn('Rate limited. Waiting 2s...');
                await sleep(2000);
                return fetchTMDB(endpoint, params);
            }
            return null; // Ignore 404 or other errors
        }
        return response.json();
    } catch (e) {
        return null;
    }
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

async function run() {
    console.log('🚀 Starting Direct Supabase Streaming Update (Infinite Batch Mode)...');

    const BATCH_SIZE = 1000;
    let offset = 0;
    let totalUpdated = 0;

    while (true) {
        console.log(`\n--- Fetching Batch: ${offset} - ${offset + BATCH_SIZE} ---`);

        const { data: movies, error } = await supabase
            .from('movies')
            .select('id, data')
            .range(offset, offset + BATCH_SIZE - 1);

        if (error || !movies || movies.length === 0) {
            console.log('✅ No more movies found. Process Complete.');
            break;
        }

        console.log(`Processing ${movies.length} movies...`);

        for (let i = 0; i < movies.length; i++) {
            const row = movies[i];
            const movieData = row.data;
            const movieId = row.id;

            if (!movieId.startsWith('tmdb-')) continue;

            const tmdbId = parseInt(movieId.replace('tmdb-', ''));

            // SMART SKIP: If already has certification, trailer, AND new CA-inclusive streaming
            // We can't be 100% sure about CA but let's assume if Cert+Trailer match, it's new.
            if (movieData.certification && movieData.trailerUrl && movieData.streamingLinks && movieData.streamingLinks.length > 0) {
                // process.stdout.write('s');
                continue;
            }

            // Fetch Streaming Data
            const details = await fetchTMDB(`/movie/${tmdbId}`, {
                append_to_response: 'watch/providers,release_dates,videos'
            });

            if (details) {
                const streamingLinks = mapStreamingLinks(details['watch/providers']);

                // Extra Metadata
                const budget = details.budget > 0 ? `$${(details.budget / 1000000).toFixed(1)}M` : movieData.budget;
                const productionCompanies = details.production_companies?.map((c: any) => c.name) || movieData.productionCompanies;
                const tagline = details.tagline || movieData.tagline;
                const originalTitle = details.original_title || movieData.originalTitle;
                const status = details.status || movieData.status;
                const boxOffice = details.revenue > 0 ? `$${(details.revenue / 1000000).toFixed(1)}M` : movieData.boxOffice;
                const duration = details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : movieData.duration;
                const languages = details.spoken_languages?.map((l: any) => l.name) || movieData.languages;

                // Certification
                let certification = movieData.certification;
                const releases = details.release_dates?.results || [];
                const targetRelease = releases.find((r: any) => r.iso_3166_1 === 'US') || releases.find((r: any) => r.iso_3166_1 === 'IN');
                if (targetRelease) {
                    const cert = targetRelease.release_dates.find((d: any) => d.certification)?.certification;
                    if (cert) certification = cert;
                }

                // Trailer
                const videos = details.videos?.results || [];
                const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
                const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : movieData.trailerUrl;


                // MERGE
                const updatedData = {
                    ...movieData,
                    streamingLinks: streamingLinks.length > 0 ? streamingLinks : movieData.streamingLinks,
                    budget,
                    productionCompanies,
                    tagline,
                    originalTitle,
                    status,
                    boxOffice,
                    duration,
                    languages,
                    certification,
                    trailerUrl
                };

                // UPDATE Supabase
                const { error: updateError } = await supabase
                    .from('movies')
                    .update({ data: updatedData })
                    .eq('id', movieId);

                if (!updateError) {
                    totalUpdated++;
                    process.stdout.write('.');
                } else {
                    process.stdout.write('E');
                }
            } else {
                process.stdout.write('x');
            }

            await sleep(50);
        }

        offset += BATCH_SIZE;
        // sleep a bit between batches
        await sleep(1000);
    }

    console.log(`\n✅ Finished! Updated ${totalUpdated} movies directly in Supabase.`);
}

run().catch(console.error);
