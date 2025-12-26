
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const tmdbKey = process.env.TMDB_API_KEY || '8da2d8399f3af98c4d290b2aaacc602e';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface StreamingLink {
    platform: string;
    url: string;
    icon?: string;
    country?: string;
    type?: 'flatrate' | 'rent' | 'buy' | 'free' | 'ads';
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchWatchProviders(tmdbId: string): Promise<StreamingLink[]> {
    const cleanId = tmdbId.replace('tmdb-', '');
    // TMDB endpoint: /movie/{movie_id}/watch/providers
    const url = `https://api.themoviedb.org/3/movie/${cleanId}/watch/providers?api_key=${tmdbKey}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 429) {
                await sleep(500); // Backoff
                return fetchWatchProviders(tmdbId);
            }
            return [];
        }

        const data = await res.json();
        const results = data.results;
        if (!results) return [];

        const links: StreamingLink[] = [];
        const REGIONS = ['US', 'IN', 'GB', 'AU', 'CA'];

        for (const region of REGIONS) {
            if (!results[region]) continue;

            const rData = results[region];
            const linkUrl = rData.link; // Main TMDB watch link

            // Process types: flatrate, rent, buy, free, ads
            const processType = (typeList: any[], typeName: 'flatrate' | 'rent' | 'buy' | 'free' | 'ads') => {
                if (!typeList) return;
                typeList.forEach((p: any) => {
                    links.push({
                        platform: p.provider_name,
                        url: linkUrl,
                        icon: `https://image.tmdb.org/t/p/original${p.logo_path}`,
                        country: region,
                        type: typeName
                    });
                });
            };

            processType(rData.flatrate, 'flatrate');
            processType(rData.rent, 'rent');
            processType(rData.buy, 'buy');
            processType(rData.free, 'free');
            processType(rData.ads, 'ads');
        }

        return links;
    } catch (e) {
        // console.error(`Error fetching for ${tmdbId}:`, e);
        return [];
    }
}

async function main() {
    console.log('Starting Categorized Sync...');

    // Get validation count
    const { count, error: countError } = await supabase.from('movies').select('*', { count: 'exact', head: true });
    if (countError) {
        console.error('Error getting count:', countError);
        return;
    }

    const totalMovies = count || 0;
    console.log(`Total movies to scan: ${totalMovies} (Estimated time: ~5 mins)`);

    // const BATCH_SIZE = 200; // Large batch reading (Unused)
    const CONCURRENCY = 20; // High concurrency for fetching external API 
    // TMDB Rate Limit is nice usually, but ~20 concurrent reqs is safe.

    const processMovie = async (row: any) => {
        if (!row.id.startsWith('tmdb-')) return 0; // Skip manual movies for now as we can't fetch by TMDB ID

        const newLinks = await fetchWatchProviders(row.id);

        if (newLinks.length > 0) {
            // Normalize & Deduplicate simply
            // e.g. if same platform + same type + same country -> dedupe
            // Actually fetchWatchProviders returns duplicates if we aren't careful? 
            // No, TMDB returns lists per type. A provider might be in 'rent' AND 'buy'. We WANT both.

            // Just ensure we don't have EXACT duplicates
            const seen = new Set();
            const cleanLinks: StreamingLink[] = [];

            for (const l of newLinks) {
                const key = `${l.platform}-${l.country}-${l.type}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    cleanLinks.push(l);
                }
            }

            // Update DB
            const { error } = await supabase.from('movies').update({
                data: { ...row.data, streamingLinks: cleanLinks }
            }).eq('id', row.id);

            if (error) console.error(`Update failed ${row.title}:`, error.message);
            return 1;
        }
        return 0;
    };

    let processed = 0;
    let updated = 0;

    // Fetch ALL IDs first (lightweight)
    let allRows: any[] = [];
    let page = 0;
    while (true) {
        const { data, error: _error } = await supabase
            .from('movies')
            .select('id, title, data')
            .range(page * 1000, (page + 1) * 1000 - 1);

        if (!data || data.length === 0) break;
        allRows = allRows.concat(data);
        page++;
        console.log(`Loaded ${allRows.length} movies into memory...`);
    }

    // WorkQueue
    console.log(`Processing ${allRows.length} movies with ${CONCURRENCY} workers...`);

    const queue = [...allRows];

    const worker = async () => {
        let wUpdated = 0;
        while (queue.length > 0) {
            const movie = queue.shift();
            if (!movie) break;
            const u = await processMovie(movie);
            wUpdated += u;
            processed++;
            if (processed % 100 === 0) process.stdout.write(`\rProgress: ${processed}/${allRows.length} | Updated: ${updated + wUpdated}`);
        }
        return wUpdated;
    };

    const workers = Array(CONCURRENCY).fill(0).map(worker);
    const results = await Promise.all(workers);
    const totalUp = results.reduce((a, b) => a + b, 0);

    console.log(`\nDone! Updated ${totalUp} movies with categorized links.`);
}

main();
