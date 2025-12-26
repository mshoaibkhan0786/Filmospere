
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const MODEL = 'gpt-4o-mini'; // Switched to gpt-4o-mini as requested
const MAX_GLOBAL_TOKENS = 2500000;
const HARD_TOKEN_LIMIT = 2500000;

// Setup Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

console.log('DEBUG: URL:', SUPABASE_URL);
console.log('DEBUG: Using Key (Start):', SUPABASE_KEY.substring(0, 10) + '...');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});



const tokenLogPath = path.join(__dirname, '../data/token_usage_log.txt');

// Target Directory for AI Data (Archives)
// Use path.resolve to get to "Filmospere\AI DATA" (sibling of "Filmospere Repo")
const AI_DATA_DIR = path.resolve(__dirname, '../../../AI DATA');

if (!fs.existsSync(AI_DATA_DIR)) {
    try {
        fs.mkdirSync(AI_DATA_DIR, { recursive: true });
        console.log(`Created AI Data Directory: ${AI_DATA_DIR}`);
    } catch (e) {
        console.error("Failed to create AI Data directory:", e);
    }
} else {
    console.log(`Using AI Data Directory: ${AI_DATA_DIR}`);
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate Content using OpenAI API (Same as before)
async function generateSEOContent(movie: any) {
    if (!OPENAI_API_KEY) throw new Error('API Key missing');

    const castNames = movie.cast?.slice(0, 5).map((c: any) => c.name).join(', ') || 'Unknown';
    const genres = movie.tags?.join(', ') || 'Unknown';
    const currentLang = movie.language || 'Unknown';

    const maxWords = 175;
    const minWords = 30;

    // User Constraint: "Professional, not generic, no spoilers"
    const prompt = `
Movie: "${movie.title}" (${movie.releaseYear})
Genre: ${genres}
Director: ${movie.director}
Cast: ${castNames}
Current Plot: "${movie.description || ''}"

Task:
1. Movie Description (Plot): Write a professional, engaging plot summary.
    - Style: Professional, cinematic, and intriguing. Avoid generic phrases like "In this movie..." or "A story about...".
    - Tone: Matches the movie's genre (e.g., tense for thriller, warm for romance).
    - Constraint: STRICTLY NO MAJOR SPOILERS. Focus on the premise and inciting incident.
    - Length: 80-120 words.
2. Why Watch: Provide 3 distinct, compelling reasons to watch. Start each with a relevant emoji.
3. Language Fix: Identify the correct primary language (e.g. "English", "Hindi").
4. SEO Metadata:
   - Meta Title: A catchy, SEO-optimized title (max 55 chars).
   - Meta Description: A clickable summary for search results (max 155 chars).
   - Keywords: 5-8 relevant tags.

Return STRICT JSON:
{
  "description": "...",
  "whyWatch": ["...", "...", "..."],
  "language": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "keywords": "..."
}
`;

    const url = `https://api.openai.com/v1/chat/completions`;
    const payload = {
        model: MODEL,
        messages: [
            { role: "system", content: "You are a professional SEO specialist and movie database expert. Provide output in valid JSON format." },
            { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 429 || response.status === 503) return { error: 'RATE_LIMIT' };
            const errText = await response.text();
            throw new Error(`OpenAI API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        const usage = data.usage;

        if (!content) return null;
        return {
            content: JSON.parse(content),
            usage: usage
        };

    } catch (e) {
        console.error('OpenAI Request Failed:', e.message);
        if (e.message.includes('503') || e.message.includes('429')) return { error: 'RATE_LIMIT' };
        return null;
    }
}

const TOTAL_TARGET = 15000; // Finish All
let totalOptimized = 0;
// Start with 50k used (from previous run) so we respect the 248k global cap
let totalTokensUsed = 50000;
// Stop at user defined limit
// const HARD_TOKEN_LIMIT is defined at top

let offset = 0;
const BATCH_SIZE = 1000;

const CONCURRENCY = 25; // "Super Fast" mode

// Simple p-limit implementation
const pLimit = (concurrency: number) => {
    // ... (keep existing pLimit implementation) ...
    const queue: (() => Promise<void>)[] = [];
    let activeCount = 0;

    const next = () => {
        activeCount--;
        if (queue.length > 0) {
            const job = queue.shift();
            if (job) job();
        }
    };

    const run = (fn: () => Promise<any>) => {
        return new Promise<void>((resolve, reject) => {
            const job = async () => {
                activeCount++;
                try {
                    await fn();
                    resolve();
                } catch (err) {
                    reject(err);
                } finally {
                    next();
                }
            };

            if (activeCount < concurrency) {
                job();
            } else {
                queue.push(job);
            }
        });
    };
    return run;
};


const limit = pLimit(CONCURRENCY);

async function processMovie(movie: any) {
    // ... (keep existing processMovie implementation) ...
    if (totalTokensUsed >= HARD_TOKEN_LIMIT) return;

    // process.stdout.write(`.`); // Minimal log for speed

    // Localized backoff per worker if needed, but for simplicity we rely on global rate handling
    const resultObj = await generateSEOContent(movie);

    if (resultObj?.error === 'RATE_LIMIT') {
        process.stdout.write('R');
        return;
    }

    if (resultObj?.content) {
        const result = resultObj.content;

        if (resultObj.usage?.total_tokens) {
            totalTokensUsed += resultObj.usage.total_tokens;
        }

        // MERGE & SAVE DIRECTLY (No re-fetch safety check)
        // MERGE LOGIC (User Constraints)
        const movieData = { ...movie };
        delete movieData.db_id;

        // 1. Description & Meta Description (ALWAYS Update)
        movieData.description = result.description;
        movieData.metaDescription = result.metaDescription; // Renamed from seoDescription
        movieData.whyWatch = result.whyWatch;

        // 2. Language: Always fix if we have a better one
        if (result.language && result.language !== 'Unknown') movieData.language = result.language;

        // 3. Meta Title & Keywords (ONLY if empty)
        if (!movie.metaTitle || movie.metaTitle.trim().length === 0) {
            movieData.metaTitle = result.metaTitle;
        }
        if (!movie.keywords || (typeof movie.keywords === 'string' && movie.keywords.trim().length === 0)) {
            movieData.keywords = result.keywords;
        }

        // 4. Set Optimized Flag
        movieData.isOptimized = true;

        const { error: updateError } = await supabase
            .from('movies')
            .update({ data: movieData })
            .eq('id', movie.db_id || movie.id);

        if (updateError) {
            process.stdout.write('E');
        } else {
            totalOptimized++;
            process.stdout.write('✅');

            // --- LOCAL SAVE (User Request) ---
            try {
                const aiDataPayload = {
                    id: movie.db_id || movie.id, // e.g. tmdb-123456
                    tmdb_id: (movie.db_id || movie.id).replace('tmdb-', ''),
                    title: movie.title, // Added as requested
                    ...result // description, whyWatch, language, metaTitle...
                };

                // Ensure filename is safe
                const safeId = (movie.db_id || movie.id).replace(/[^a-z0-9-]/gi, '_');
                const filePath = path.join(AI_DATA_DIR, `${safeId}.json`);
                fs.writeFileSync(filePath, JSON.stringify(aiDataPayload, null, 2));
            } catch (err) {
                console.error(`Local save failed for ${movie.db_id}:`, err);
            }
        }
    } else {
        process.stdout.write('_');
    }
}

async function run() {
    console.log(`🚀 Starting SEO Optimization (Infinite Mode) with ${MODEL}...`);
    console.log(`🎯 TARGET: REMAINING UNOPTIMIZED MOVIES`);

    while (true) {
        if (totalOptimized >= TOTAL_TARGET) {
            console.log('Hit global safety cap. Exiting.');
            break;
        }



        console.log(`\n--- Fetching batch (Offset: ${offset}) ---`);
        const { data: movies, error } = await supabase
            .from('movies')
            .select('*')
            // No specific order, just scan everything
            .range(offset, offset + BATCH_SIZE - 1);

        if (error || !movies) {
            console.error('Failed to fetch movies:', error);
            await sleep(5000);
            continue;
        }

        if (movies.length === 0) {
            console.log('✅ Reached end of database. Done.');
            break;
        }

        // Filter: Catch unoptimized OR broken optimized states
        const candidates = movies
            .map(row => ({ ...row.data, db_id: row.id }))
            .filter(m => {
                // 1. If it's effectively unoptimized (false flag or missing flag), process it.
                if (!m.isOptimized) return true;

                // 2. REPAIR MODE: If it claims to be optimized but is missing critical fields
                if (!m.metaDescription || m.metaDescription.length < 5) return true;
                if (!m.whyWatch || m.whyWatch.length === 0) return true;

                // Otherwise, it's genuinely optimized
                return false;
            });

        if (candidates.length === 0) {
            // optimized candidates in this batch? Skip.
            console.log(`✅ All movies in this batch are healthy. Skipping.`);
            offset += BATCH_SIZE;
            continue;
        }

        console.log(`\n🚀 Parallel Processing ${candidates.length} movies (Concurrency: ${CONCURRENCY})...`);

        // Execute in parallel
        await Promise.all(candidates.map(movie => limit(() => processMovie(movie))));

        console.log(`\nBatch Complete. Stats: ${totalOptimized} Optimized | ${totalTokensUsed} Tokens`);

        // Always advance
        offset += BATCH_SIZE;
    }
}

run().catch(console.error);
