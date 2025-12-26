
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment Variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; // Prefer Service Key for Writes
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
    console.error('Missing Environment Variables (SUPABASE_URL, SUPABASE_KEY, or OPENAI_API_KEY)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// The "Relevant 15" - High complexity/engagement movies
const TARGET_MOVIES = [
    "Inception",
    "Interstellar",
    "The Dark Knight",
    "Fight Club",
    "The Matrix",
    "Parasite",
    "Joker",
    "Prisoners",
    "Se7en",
    "The Prestige",
    "Memento",
    "Gone Girl",
    "Oldboy",
    "Arrival",
    "Hereditary",
    "Shutter Island"
];

async function generateArticle(movie: any) {
    console.log(`\n🤖 Generating article for: ${movie.title}...`);

    const prompt = `
    You are an obsessive film theorist who solves movie mysteries.
    Target Audience: Hardcore fans who have already seen the movie "${movie.title}".

    **YOUR MISSION:**
    Write a specialized "Deep Dive" article arguing a specific point or explaining the ending.
    DO NOT summarize the plot. Assume the reader knows it.

    **STRICT FORMATTING RULES:**
    1.  **Length:** 500-800 words (Quality > Quantity).
    2.  **Formatting:**
        *   You MUST use at least one **Blockquote** (> quote) for a key line of dialogue.
        *   You MUST use a **Bulleted List** for "Clues" or "Key Visuals".
        *   Use **H2** headers that are descriptive (e.g., "The Red Door", not "Symbolism").
    3.  **Tone:**
        *   Direct and Punchy. Short sentences.
        *   No academic fluff ("It is interesting to note...").
        *   Be opinionated. Tell us what the ending *really* means.

    **ARTICLE STRUCTURE:**
    1.  **The Hook:** Start with a bold question or statement about the movie's central mystery.
    2.  **The Theory/Explanation:** Break down the Ending or the Theme.
    3.  **The Evidence:** (Bulleted List of specific scenes/clues).
    4.  **The Verdict:** What does this mean for the character? (e.g., "He chose to die as a good man").

    **REQUIRED JSON OUTPUT:**
    {
        "title": "A headline that promises a specific answer (e.g., 'Why the Top Wobbles: The Definitive Inception Theory')",
        "excerpt": "A provocative 1-2 sentence hook that hints at the article's core argument. (Max 140 chars)",
        "content": "Full article body in Markdown. Use H2 (##) and H3 (###). Use **bold** for key terms. Minimum 1000 words. NO H1.",
        "category": "Deep Dive",
        "tags": ["Analysis", "Ending Explained", "Theories"],
        "meta_title": "SEO title, compelling and keyword-rich (max 60 chars)",
        "meta_description": "SEO description that drives clicks (max 160 chars)",
        "keywords": "movie name, ending explained, analysis, theory, director name"
    }

    Context:
    - Description: ${movie.description}
    - Director: ${movie.director}
    - Cast: ${movie.cast?.map((c: any) => c.name).join(', ')}
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Using GPT-4o for best reasoning
            messages: [
                { role: "system", content: "You are a helpful AI that generates structured JSON content." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            max_tokens: 3000, // Reduced max tokens as article length is shorter
            temperature: 0.8, // Slightly more creative
        });

        const result = completion.choices[0].message.content;
        if (!result) throw new Error("No content returned from OpenAI");

        const articleData = JSON.parse(result);
        return articleData;

    } catch (error) {
        console.error(`❌ Error generating for ${movie.title}:`, error);
        return null;
    }
}

async function main() {
    console.log("🚀 Starting Article Generation (Target: 15 Relevant Articles)...");

    // 1. Fetch Target Movies from DB
    console.log("Querying database for target movies...");
    const { data: candidates, error } = await supabase
        .from('movies')
        .select('*')
        .in('title', TARGET_MOVIES);

    if (error || !candidates) {
        console.error('Failed to fetch movies:', error);
        return;
    }

    console.log(`Found ${candidates.length} target movies in database.`);

    for (const movie of candidates) {
        // EXPLICIT PROTECTION FOR SHUTTER ISLAND
        if (movie.title === 'Shutter Island' || movie.title.toLowerCase().includes('shutter island')) {
            console.log("🔒 Skipping Shutter Island (Protected Content).");
            continue;
        }

        // 2. Check if article already exists
        const { data: existing } = await supabase
            .from('articles')
            .select('id')
            .eq('related_movie_id', movie.slug || movie.id)
            .maybeSingle();

        console.log(`\n🤖 Processing: ${movie.title}...`);

        // 3. Generate Content
        const generated = await generateArticle(movie);
        if (!generated) continue;

        const slug = generated.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        const payload = {
            slug: slug,
            title: generated.title,
            excerpt: generated.excerpt,
            content: generated.content,
            image_url: movie.backdropUrl || movie.posterUrl,
            author: 'Filmosphere Analysis', // Changed author name slightly
            category: generated.category || 'Deep Dive',
            tags: generated.tags,
            related_movie_id: movie.slug || movie.id,
            is_published: true,
            meta_title: generated.meta_title,
            meta_description: generated.meta_description,
            keywords: generated.keywords
            // updated_at removed as column doesn't exist
        };

        if (existing) {
            console.log(`🔄 Updating existing article for: ${movie.title}`);
            const { error: updateError } = await supabase
                .from('articles')
                .update(payload)
                .eq('id', existing.id);

            if (updateError) console.error(`❌ Update failed:`, updateError);
            else console.log(`✅ Update success!`);
        } else {
            console.log(`✨ Creating new article for: ${movie.title}`);
            const { error: insertError } = await supabase
                .from('articles')
                .insert({
                    ...payload,
                    created_at: new Date().toISOString()
                });

            if (insertError) console.error(`❌ Insert failed:`, insertError);
            else console.log(`✅ Insert success!`);
        }
    }

    console.log("\n✨ Done!");
}

main();
