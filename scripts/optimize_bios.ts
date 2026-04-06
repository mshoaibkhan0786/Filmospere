import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// --- CONFIG ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const BATCH_SIZE = 200; // Smaller batch size to prevent memory issues
const CONCURRENCY = 25;
const HIGH_TIER_TOKEN_LIMIT = 200000;
// --------------

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
    console.error('Missing credentials (SUPABASE or OPENAI)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// Global state
const state = {
    highTierTokens: 0,
    startTime: Date.now(),
    processedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    processedIds: new Set<string>() // Track IDs processed in this run to avoid duplicates across batches
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchTmdbPerson(id: string) {
    const url = `https://api.themoviedb.org/3/person/${id}?append_to_response=movie_credits`;
    let attempts = 0;
    while (attempts < 3) {
        try {
            const res = await fetch(url, {
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${TMDB_READ_TOKEN}`
                }
            });

            if (res.ok) {
                return await res.json();
            } else if (res.status === 429) {
                const wait = 2000 * Math.pow(2, attempts);
                // console.log(`    ⚠️ TMDB Rate Limit for ${id}. Waiting ${wait}ms...`);
                await sleep(wait);
                attempts++;
            } else if (res.status === 404) {
                return null;
            } else {
                return null;
            }
        } catch (e: any) {
            await sleep(1000);
            attempts++;
        }
    }
    return null;
}

async function generateAIBio(name: string, originalBio: string, facts: any, popularity: number) {
    const isTopActor = popularity > 5;
    const canUseHighTier = isTopActor && state.highTierTokens < HIGH_TIER_TOKEN_LIMIT;

    let targetModel = 'gpt-4o-mini';
    if (canUseHighTier) {
        targetModel = 'gpt-5';
    }

    const prompt = `
You are an expert film biographer. Rewrite the following biography for **${name}** to be engaging, professional, and narrative.

**Input Data:**
- Name: ${name}
- Born: ${facts.birthday || 'Unknown'} in ${facts.place_of_birth || 'Unknown'}
- Known For: ${facts.known_for?.join(', ') || 'Various roles'}
- Original Bio: "${originalBio}"

**Instructions:**
1. **Simple & Accessible**: Use simple, clear, and easy-to-understand words. Avoid complex jargon.
2. **SEO Friendly**: Naturally include the actor's name and key movies early in the text.
3. **Narrative Flow**: Do NOT start with "${name} is an actor..." or "born in...". Start with a hook about their acting style, legacy, or a defining characteristic.
4. **Non-Generic**: Avoid generic phrases like "He is known for his work in...". Instead, weave their best works into the narrative naturally.
5. **Varied Structure**: Do not use repetitive sentence structures.
6. **Tone**: Professional, appreciative, yet objective.
7. **Length**: Keep it concise (approx 100-150 words).    

Return ONLY the rewritten text. No JSON, no markdown blocks.
`;

    const makeRequest = async (model: string) => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: "You are a professional biographer." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI Error ${response.status}: ${response.statusText}`);
        }
        return response;
    };

    try {
        let response;
        let usedModel = targetModel;

        try {
            response = await makeRequest(targetModel);
        } catch (e) {
            if (targetModel === 'gpt-5') {
                usedModel = 'gpt-4o';
                try {
                    response = await makeRequest('gpt-4o');
                } catch (e2) {
                    usedModel = 'gpt-4o-mini';
                    response = await makeRequest('gpt-4o-mini');
                }
            } else {
                throw e;
            }
        }

        const data = await response.json();

        if (data.usage) {
            const tokens = data.usage.total_tokens;
            if (usedModel === 'gpt-5' || usedModel === 'gpt-4o') {
                state.highTierTokens += tokens;
            }
        }

        return data.choices?.[0]?.message?.content?.trim();
    } catch (e) {
        return null;
    }
}

async function processActor(actor: any, existingIds: Set<string>) {
    if (existingIds.has(actor.id) || state.processedIds.has(actor.id)) return;

    const tmdbData = await fetchTmdbPerson(actor.id);
    if (!tmdbData) return;

    const originalBio = tmdbData.biography;

    if (!originalBio ||
        originalBio.length < 50 ||
        originalBio.toLowerCase().includes('biography not available')) {
        return;
    }

    const facts = {
        birthday: tmdbData.birthday,
        place_of_birth: tmdbData.place_of_birth,
        known_for: tmdbData.movie_credits?.cast?.sort((a: any, b: any) => b.popularity - a.popularity).slice(0, 3).map((m: any) => m.title)
    };

    const newBio = await generateAIBio(actor.name, originalBio, facts, tmdbData.popularity);

    if (!newBio) return;

    const payload = {
        tmdb_id: `tmdb-person-${actor.id}`,
        name: actor.name,
        biography: newBio,
        image_url: tmdbData.profile_path,
        updated_at: new Date().toISOString()
    };

    const { error: upsertError } = await supabase
        .from('cast')
        .upsert(payload, { onConflict: 'tmdb_id' });

    if (upsertError) {
        if (!upsertError.message.includes('cast_name_key') && upsertError.code !== '23505') {
            console.error(`    ❌ DB Error for ${actor.name}:`, upsertError.message);
        }
    } else {
        state.processedCount++;
        state.processedIds.add(actor.id); // Mark as done for this session

        if (state.processedCount % 5 === 0) {
            const elapsed = (Date.now() - state.startTime) / 1000;
            const rate = state.processedCount / elapsed;
            console.log(`✅ Processed: ${state.processedCount} | Rate: ${rate.toFixed(2)}/s | High-Tier Tokens: ${state.highTierTokens}/${HIGH_TIER_TOKEN_LIMIT}`);
        }
    }
}

async function run() {
    const args = process.argv.slice(2);
    let currentOffset = parseInt(args[0]) || 0;

    // We don't use a hard limit for processing anymore, we run until movies run out.
    // Argument 2 could be "MAX_MOVIES_TO_SCAN" if needed, but let's default to Infinity.
    const maxScan = parseInt(args[1]) || 100000;

    console.log(`🚀 Starting Batched Biography Optimization...`);
    console.log(`   - Start Offset: ${currentOffset}`);
    console.log(`   - Batch Size: ${BATCH_SIZE}`);
    console.log(`   - Workers: ${CONCURRENCY}`);

    console.log('   - Loading existing cast (all)...');
    // Fetch ALL existing IDs to perform efficient skipping
    // Supabase limit is usually 1000, we need to loop this too or rely on the user having 47k - 
    // actually, for 47k rows, we might need a better strategy or just fetch 'tmdb_id' in chunks if it fails.
    // For now, let's try csv download or stream? 
    // Or just simple loop.

    const existingIds = new Set<string>();
    let fetchOffset = 0;
    while (true) {
        const { data: chunk, error } = await supabase
            .from('cast')
            .select('tmdb_id')
            .not('biography', 'is', null)
            .range(fetchOffset, fetchOffset + 999);

        if (!chunk || chunk.length === 0) break;

        chunk.forEach(c => existingIds.add(c.tmdb_id.replace('tmdb-person-', '')));
        fetchOffset += 1000;
        // Optimization: if we already have 50k, this map is fine (~5-10MB RAM).
    }
    console.log(`   - Found ${existingIds.size} already optimized actors in DB.`);

    // --- MAIN BATCH LOOP ---

    while (currentOffset < maxScan) {
        const endRange = currentOffset + BATCH_SIZE - 1;
        // console.log(`\n📂 Loading Batch: [${currentOffset} - ${endRange}]`);

        const { data: movies, error } = await supabase
            .from('movies')
            .select('data')
            .range(currentOffset, endRange);

        if (error) {
            console.error(`❌ Batch Fetch Error at ${currentOffset}:`, error);
            break;
        }

        if (!movies || movies.length === 0) {
            console.log('🏁 No more movies found. Job Complete.');
            break;
        }

        // Collect Actors in this batch
        const batchActors = new Map();
        movies.forEach(m => {
            if (m.data?.cast) {
                m.data.cast.forEach((c: any) => {
                    const match = c.id.match(/-(\d+)$/) || c.id.match(/^(\d+)$/);
                    if (match) {
                        const tmdbId = match[1];
                        // Skip if already in DB OR processed in this session
                        if (!existingIds.has(tmdbId) &&
                            !state.processedIds.has(tmdbId) &&
                            !batchActors.has(tmdbId)) {
                            batchActors.set(tmdbId, { id: tmdbId, name: c.name });
                        }
                    }
                });
            }
        });

        const actors = Array.from(batchActors.values());
        if (actors.length > 0) {
            console.log(`   - Batch ${currentOffset}: Found ${actors.length} new candidates.`);

            // Worker Pool for this batch
            const queue = [...actors];
            const worker = async () => {
                while (queue.length > 0) {
                    const actor = queue.shift();
                    if (actor) await processActor(actor, existingIds);
                }
            };

            const workers = [];
            for (let i = 0; i < CONCURRENCY; i++) {
                workers.push(worker());
            }

            await Promise.all(workers);
        } else {
            // console.log(`   - Batch ${currentOffset}: All actors already processed.`);
        }

        currentOffset += BATCH_SIZE;
    }

    console.log('\n--- ALL BATCHES COMPLETE ---');
    console.log(`Total Processed: ${state.processedCount}`);
    console.log(`Time Elapsed: ${((Date.now() - state.startTime) / 1000).toFixed(1)}s`);
}

run();
