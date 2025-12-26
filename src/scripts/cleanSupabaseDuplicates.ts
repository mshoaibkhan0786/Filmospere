
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

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
}

async function main() {
    console.log('Fetching all movies...');

    // Get Validation count
    const { count, error: countError } = await supabase.from('movies').select('*', { count: 'exact', head: true });
    if (countError) {
        console.error('Error getting count:', countError);
        return;
    }

    const totalMovies = count || 0;
    console.log(`Total movies to scan: ${totalMovies}`);

    const BATCH_SIZE = 500;
    const CONCURRENCY = 5;
    const totalBatches = Math.ceil(totalMovies / BATCH_SIZE);

    // Helper to process a batch
    const processBatch = async (batchIndex: number) => {
        const from = batchIndex * BATCH_SIZE;
        const to = from + BATCH_SIZE - 1;

        const { data: movies, error } = await supabase
            .from('movies')
            .select('id, title, data')
            .range(from, to);

        if (error) {
            console.error(`Error fetching batch ${batchIndex}:`, error.message);
            return 0;
        }

        if (!movies || movies.length === 0) return 0;

        let batchUpdated = 0;
        const updates = [];

        for (const row of movies) {
            const movieData = row.data;
            const originalLinks: StreamingLink[] = movieData.streamingLinks || [];

            if (originalLinks.length === 0) continue;

            // Safe Deduplication Logic with Normalization
            const uniqueLinksMap = new Map<string, StreamingLink>();
            const normalizePlatform = (p: string) => {
                const lower = p.toLowerCase();
                if (lower.includes('netflix')) return 'netflix';
                if (lower.includes('prime video') || lower.includes('amazon video')) return 'amazon prime video';
                if (lower.includes('disney') || lower.includes('hotstar')) return 'disney+';
                if (lower.includes('hulu')) return 'hulu';
                if (lower.includes('hbo') || lower.includes('max')) return 'hbo max';
                if (lower.includes('apple tv')) return 'apple tv';
                if (lower.includes('peacock')) return 'peacock';
                if (lower.includes('paramount')) return 'paramount+';
                if (lower.includes('tubi')) return 'tubi';
                if (lower.includes('crunchyroll')) return 'crunchyroll';
                if (lower.includes('youtube')) return 'youtube';
                if (lower.includes('zee5')) return 'zee5';
                if (lower.includes('jio')) return 'jiocinema';
                if (lower.includes('sony')) return 'sonyliv';
                return lower.trim();
            };

            originalLinks.forEach(link => {
                const platform = normalizePlatform(link.platform);
                const country = link.country || 'US';
                const key = `${platform}-${country.toLowerCase()}`;

                if (uniqueLinksMap.has(key)) {
                    const existing = uniqueLinksMap.get(key)!;
                    if (!existing.url && link.url) {
                        uniqueLinksMap.set(key, link);
                    } else if (existing.url && !link.url) {
                        // keep existing
                    } else {
                        if (link.platform.length < existing.platform.length) {
                            uniqueLinksMap.set(key, link);
                        }
                    }
                } else {
                    uniqueLinksMap.set(key, link);
                }
            });

            const newLinks = Array.from(uniqueLinksMap.values());

            if (newLinks.length !== originalLinks.length) {
                movieData.streamingLinks = newLinks;
                // Push update promise
                updates.push(
                    supabase.from('movies').update({ data: movieData }).eq('id', row.id)
                        .then(({ error }) => {
                            if (error) console.error(`Failed update ${row.title}:`, error.message);
                            else batchUpdated++;
                        })
                );
            }
        }

        await Promise.all(updates);
        console.log(`Batch ${batchIndex + 1}/${totalBatches} done. Updated ${batchUpdated} movies.`);
        return batchUpdated;
    };

    // Run with concurrency limit
    const batches = Array.from({ length: totalBatches }, (_, i) => i);
    let updatedTotal = 0;

    for (let i = 0; i < batches.length; i += CONCURRENCY) {
        const chunk = batches.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(b => processBatch(b)));
        updatedTotal += results.reduce((a, b) => a + b, 0);
    }

    console.log(`Done! Updated total: ${updatedTotal}`);
}

main();
