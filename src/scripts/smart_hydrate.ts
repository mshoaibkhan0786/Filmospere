
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import axios from 'axios';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '';
// Hardcoded token from src/services/tmdb.ts (since .env is missing it)
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';
const openaiKey = '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';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Environment Variables. Please check .env (need VITE_SUPABASE_URL, SERVICE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Configuration
const POPULARITY_THRESHOLD = 15; // Only AI optimize if popularity > 15
const MAX_AI_OPTIMIZATIONS = 4000; // Hard limit to satisfy 2.5M token budget (~600 tokens/actor)
const BATCH_SIZE = 50;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// TMDB Fetch
async function fetchTmdbPerson(tmdbId: string) {
    try {
        const id = tmdbId.replace('tmdb-person-', '');
        // Fetch details AND mostly images/credits to determine popularity/relevance
        const url = `https://api.themoviedb.org/3/person/${id}`;
        const res = await axios.get(url, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_READ_TOKEN}`
            },
            timeout: 10000
        });
        return res.data;
    } catch (e) {
        return null; // 404 or error
    }
}

// AI Optimization
async function optimzeBio(name: string, rawBio: string, knownFor: string) {
    try {
        const prompt = `
        Rewrite the biography for the actor "${name}" (Known for: ${knownFor}).
        
        Rules:
        1. Make it engaging, professional, and SEO-friendly.
        2. Keep it between 100-200 words.
        3. Do not invent facts. Use the context provided.
        4. If the raw bio is empty, write a generic professional bio based on their fame (or return empty if unknown).
        
        Raw Bio: "${rawBio.substring(0, 1000)}..."
        `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
            max_tokens: 350,
        });

        return completion.choices[0].message.content || rawBio;
    } catch (e) {
        console.error(`AI Error for ${name}:`, e);
        return rawBio; // Fallback
    }
}

async function main() {
    console.log('🚀 Starting Smart Hydration...');
    console.log(`Config: Pop Threshold=${POPULARITY_THRESHOLD}, Max AI=${MAX_AI_OPTIMIZATIONS}`);

    let aiCount = 0;
    let rawCount = 0;
    let errors = 0;
    let processed = 0;

    // We process in loops using cursor pagination to safer handling of large dataset
    // But since we are modifying the data (setting bio), the "Where Bio Is Null" query naturally paginates itself!
    // We just keep fetching "Null Bio" records until none are left.

    while (true) {
        // Fetch Batch of NULL bios
        const { data: people, error } = await supabase
            .from('cast')
            .select('*')
            .is('biography', null)
            .limit(BATCH_SIZE);

        if (error) {
            console.error('Supabase Fetch Error:', error);
            // Wait and retry once?
            await sleep(5000);
            if (errors++ > 5) break;
            continue;
        }

        if (!people || people.length === 0) {
            console.log('✅ No more people with NULL biographies found.');
            break;
        }

        console.log(`Processing batch of ${people.length}... (Total Processed: ${processed})`);

        // Process Parallel-ish (but limited to avoid rate limits)
        for (const person of people) {
            processed++;
            const tmdbId = person.tmdb_id; // "tmdb-person-123"

            if (!tmdbId || !tmdbId.startsWith('tmdb-person-')) {
                // Invalid ID, skip or mark ignored?
                // Just log
                continue;
            }

            // 1. Fetch TMDB
            const tmdbData = await fetchTmdbPerson(tmdbId);
            await sleep(50); // Rate limit protection for TMDB

            if (!tmdbData) {
                // Person deleted or not found? 
                // We should probably set bio to empty string to stop re-fetching?
                // Or "Bio unavailable".
                await supabase.from('cast').update({ biography: '', updated_at: new Date().toISOString() }).eq('id', person.id);
                process.stdout.write('x'); // mark failed
                continue;
            }

            const popularity = tmdbData.popularity || 0;
            const rawBio = tmdbData.biography || '';
            const knownFor = tmdbData.known_for_department || 'Acting';

            let finalBio = rawBio;
            let isAi = false;

            // 2. Decide: AI or Raw?
            // Condition: Famous Enough AND We have budget AND Raw bio isn't super long already (if it's great, why rewrite?)
            // Actually user wants SEO optimization.

            if (popularity >= POPULARITY_THRESHOLD && aiCount < MAX_AI_OPTIMIZATIONS) {
                // OPTIMIZE
                if (rawBio.length > 10) { // Only optimize if we have something to work with, or if name is famous enough
                    finalBio = await optimzeBio(tmdbData.name, rawBio, knownFor);
                    aiCount++;
                    isAi = true;
                    process.stdout.write('✨'); // AI Star
                } else {
                    process.stdout.write('.'); // Raw (Too short to optimize)
                }
            } else {
                process.stdout.write('.'); // Raw
                rawCount++;
            }

            // 3. Update DB
            // We update bio, birthday, place, image (if better?)
            const updates: any = {
                biography: finalBio,
                birthday: tmdbData.birthday,
                place_of_birth: tmdbData.place_of_birth,
                deathday: tmdbData.deathday,
                updated_at: new Date().toISOString()
            };

            if (tmdbData.profile_path) {
                updates.image_url = tmdbData.profile_path; // Sync image
            }

            // Safe Update: Verify we are NOT touching roles. 
            // 'cast' table schema usually: id, name, tmdb_id, image_url, biography, etc.

            await supabase
                .from('cast')
                .update(updates)
                .eq('id', person.id);
        }

        console.log(`\nBatch done. AI: ${aiCount}, Raw: ${rawCount}. Sleeping 1s...`);
        await sleep(1000);
    }

    console.log(`\n🎉 Hydration Complete!`);
    console.log(`Total Optimized (AI): ${aiCount}`);
    console.log(`Total Standard (Raw): ${rawCount}`);
}

main();
