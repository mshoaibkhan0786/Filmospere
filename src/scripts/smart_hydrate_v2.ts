
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
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';
const openaiKey = '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';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Environment Variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

const POPULARITY_THRESHOLD = 15;
const MAX_AI_OPTIMIZATIONS = 4000;
const BATCH_SIZE = 50;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTmdbPerson(tmdbId: string) {
    try {
        const id = tmdbId.replace('tmdb-person-', '');
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
        return null;
    }
}

async function optimizeBio(name: string, rawBio: string, knownFor: string) {
    try {
        const prompt = `Rewrite the biography for "${name}" (Known for: ${knownFor}). Make it engaging, professional, and SEO-friendly (100-200 words). Do not invent facts.

Raw Bio: "${rawBio.substring(0, 1000)}..."`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
            max_tokens: 350,
        });

        return completion.choices[0].message.content || rawBio;
    } catch (e) {
        console.error(`AI Error for ${name}:`, e);
        return rawBio;
    }
}

async function main() {
    console.log('🚀 Starting Smart Hydration V2...');
    console.log(`Config: Pop Threshold=${POPULARITY_THRESHOLD}, Max AI=${MAX_AI_OPTIMIZATIONS}`);

    let aiCount = 0;
    let rawCount = 0;
    let failedCount = 0;
    let processed = 0;
    let loopCount = 0;
    const MAX_LOOPS = 1000; // Safety: max 1000 batches (50k records)

    while (loopCount++ < MAX_LOOPS) {
        const { data: people, error } = await supabase
            .from('cast')
            .select('*')
            .is('biography', null)
            .limit(BATCH_SIZE);

        if (error) {
            console.error('Supabase Fetch Error:', error);
            await sleep(5000);
            continue;
        }

        if (!people || people.length === 0) {
            console.log('✅ No more NULL biographies found.');
            break;
        }

        console.log(`\nBatch ${loopCount}: ${people.length} records (Total Processed: ${processed})`);

        for (const person of people) {
            processed++;
            const tmdbId = person.tmdb_id;

            if (!tmdbId || !tmdbId.startsWith('tmdb-person-')) {
                // Mark as processed to avoid re-fetch
                await supabase.from('cast').update({ biography: '' }).eq('id', person.id);
                process.stdout.write('s');
                continue;
            }

            const tmdbData = await fetchTmdbPerson(tmdbId);
            await sleep(50);

            if (!tmdbData) {
                // CRITICAL FIX: Mark as empty to stop infinite loop
                const { error: updateErr } = await supabase
                    .from('cast')
                    .update({ biography: '', updated_at: new Date().toISOString() })
                    .eq('id', person.id);

                if (updateErr) console.error('Update failed:', updateErr);

                failedCount++;
                process.stdout.write('x');
                continue;
            }

            const popularity = tmdbData.popularity || 0;
            const rawBio = tmdbData.biography || '';
            const knownFor = tmdbData.known_for_department || 'Acting';

            let finalBio = rawBio;

            // AI optimize ALL actors with bio > 50 chars (up to MAX limit)
            if (aiCount < MAX_AI_OPTIMIZATIONS && rawBio.length > 50) {
                finalBio = await optimizeBio(tmdbData.name, rawBio, knownFor);
                aiCount++;
                rawCount++; // Count both
                process.stdout.write('✨');
            } else {
                rawCount++;
                process.stdout.write('.');
            }

            // CRITICAL FIX: Check update result
            const { error: updateErr } = await supabase
                .from('cast')
                .update({
                    biography: finalBio,
                    birthday: tmdbData.birthday,
                    place_of_birth: tmdbData.place_of_birth,
                    deathday: tmdbData.deathday,
                    image_url: tmdbData.profile_path || person.image_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', person.id);

            if (updateErr) {
                console.error(`\nFailed to update ${person.name}:`, updateErr);
            }
        }

        console.log(`\nBatch done. AI: ${aiCount}, Raw: ${rawCount}, Failed: ${failedCount}`);
        await sleep(1000);
    }

    console.log(`\n🎉 Hydration Complete!`);
    console.log(`AI Optimized: ${aiCount}`);
    console.log(`Raw TMDB: ${rawCount}`);
    console.log(`Failed/Empty: ${failedCount}`);
    console.log(`Total Processed: ${processed}`);
}

main();
