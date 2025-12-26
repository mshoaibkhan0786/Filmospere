
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// --- CONFIGURATION ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const MODEL = 'gpt-4o-mini';

// Setup Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function generateSEOContent(movie: any) {
    if (!OPENAI_API_KEY) throw new Error('API Key missing');

    const castNames = movie.cast?.slice(0, 5).map((c: any) => c.name).join(', ') || 'Unknown';
    const genres = movie.tags?.join(', ') || 'Unknown';
    const currentLang = movie.language || 'Unknown';

    const maxWords = 125;
    const minWords = 80;

    const prompt = `
Movie: "${movie.title}" (${movie.releaseYear})
Genre: ${genres}
Director: ${movie.director}
Cast: ${castNames}
Current Plot: "${movie.description || ''}"
Current Language Code: "${currentLang}"

Task:
1. Movie Description (Plot): Regenerate the movie description/plot. 
    - Style: Professional yet simple and easy to understand (Plain English). Avoid complex jargon.
    - Structure: DO NOT start with "In [Movie Name]...", "[Movie Name] follows...", or "This movie...". Start directly with the premise, character, or conflict to ensure variety across the database.
    - Length: Strictly under ${maxWords} words. (Target ${minWords}-${maxWords - 10} words). Focus on the main premise without major spoilers. 
2. Why Watch: Provide 3 distinct, punchy reasons to watch this movie. Start each with a relevant emoji.
3. Language Fix: Identify the correct primary language of the movie. ESPECIALLY if the Current Language Code is "International" or "Unknown", find the actual language (e.g. "English", "Hindi", "Korean", "Spanish").
4. SEO Metadata:
   - Meta Title: A catchy, SEO-friendly title (max 60 chars). Include the Movie Title.
   - Meta Description: A compelling summary for search results (max 160 chars).
   - Keywords: A comma-separated list of 5-8 relevant keywords (genre, mood, actors, themes).

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
            const errText = await response.text();
            throw new Error(`OpenAI API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) return null;
        return JSON.parse(content);

    } catch (e) {
        console.error('OpenAI Request Failed:', e.message);
        return null;
    }
}

async function run() {
    const targetId = 'tmdb-71446';
    console.log(`🚀 Starting SEO Optimization for Money Heist (${targetId})...`);

    const { data: movieRow, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', targetId)
        .single();

    if (error || !movieRow) {
        console.error('Failed to fetch movie:', error);
        return;
    }

    const movie = { ...movieRow.data, db_id: movieRow.id };

    // Explicitly check for streaming links to preserve them
    const existingStreamingLinks = movie.streamingLinks;
    console.log("Current Streaming Links:", JSON.stringify(existingStreamingLinks, null, 2));

    const result = await generateSEOContent(movie);

    if (result) {
        // MERGE & SAVE
        const movieData = { ...movie };
        delete movieData.db_id;

        movieData.description = result.description;
        movieData.whyWatch = result.whyWatch;
        if (result.language && result.language !== 'Unknown') movieData.language = result.language;
        movieData.metaTitle = result.metaTitle;
        movieData.metaDescription = result.metaDescription;
        movieData.keywords = result.keywords;
        movieData.isOptimized = true;

        // Ensure streamingLinks are preserved (redundant with ...movie but explicitly safe)
        if (existingStreamingLinks) {
            movieData.streamingLinks = existingStreamingLinks;
        }

        const { error: updateError } = await supabase
            .from('movies')
            .update({ data: movieData })
            .eq('id', targetId);

        if (updateError) {
            console.error('Error updating Supabase:', updateError);
        } else {
            console.log('✅ Successfully optimized Money Heist!');
            console.log('New Description:', movieData.description);
            console.log('Preserved Streaming Links:', !!movieData.streamingLinks);
        }
    } else {
        console.error('Failed to generate content via OpenAI');
    }
}

run().catch(console.error);
