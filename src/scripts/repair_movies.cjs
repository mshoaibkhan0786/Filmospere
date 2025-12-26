
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env
dotenv.config();
// Load .env.local (override)
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
    const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

// Config - Fallback to keys found in other scripts
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const tmdbToken = process.env.VITE_TMDB_READ_ACCESS_TOKEN || process.env.VITE_TMDB_ACCESS_TOKEN;
// FOUND KEYS
const TMDB_API_KEY_FALLBACK = '8da2d8399f3af98c4d290b2aaacc602e';
const OPENAI_API_KEY_FALLBACK = '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';

const openaiKey = process.env.VITE_OPENAI_API_KEY || OPENAI_API_KEY_FALLBACK;
const shouldUseTmdbKey = !tmdbToken;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase Env Vars.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const openai = new OpenAI({ apiKey: openaiKey });

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function repairMovies() {
    console.log("🔍 Scanning for damaged movies (High Votes, Zero Rating)...");

    // 1. Find Broken Movies (Batch mode to avoid timeout)
    // Use .eq for rating 0 which is potentially faster than .lt with types
    const { data: brokenMovies, error } = await supabase
        .from('movies')
        .select('*')
        .gt('data->voteCount', 50)
        .eq('data->rating', 0)
        .limit(20);

    if (error) {
        console.error("Error fetching movies:", error);
        return;
    }

    if (!brokenMovies || brokenMovies.length === 0) {
        console.log("✅ No broken movies found!");
        return;
    }

    console.log(`⚠️ Found ${brokenMovies.length} movies to repair.`);

    for (const record of brokenMovies) {
        const title = record.title;
        let originalId = record.data.id || record.id;

        console.log(`\n--------------------------------------------------`);
        console.log(`🔧 Processing: "${title}" (Current ID: ${originalId})`);

        // 2. Extract Valid TMDB ID
        // Handle corrupted strings like "tmdb-12345tmdb-67890" or "tmdb-12345"
        const match = originalId.match(/tmdb-(\d+)/);
        if (!match) {
            console.error(`   ❌ Could not extract valid TMDB ID from: ${originalId}`);
            continue;
        }

        const tmdbId = match[1];
        const numericId = parseInt(tmdbId);
        const correctFullId = `tmdb-${tmdbId}`; // Standardize

        console.log(`   ✅ Resolved TMDB ID: ${tmdbId}`);

        try {
            // 3. Fetch Fresh Data directly from TMDB
            console.log(`   ⬇️ Fetching fresh metadata & streaming links from TMDB...`);

            const config = {
                params: {
                    append_to_response: 'watch/providers,credits,videos'
                }
            };

            if (shouldUseTmdbKey) {
                config.params.api_key = TMDB_API_KEY_FALLBACK;
            } else {
                config.headers = {
                    Authorization: `Bearer ${tmdbToken}`
                };
            }

            const tmdbRes = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, config);
            const details = tmdbRes.data;

            // 4. Map Metadata
            // We use the existing record data as base, but OVERWRITE with fresh details
            const updatedData = { ...record.data };

            updatedData.id = correctFullId; // Fix ID
            updatedData.rating = details.vote_average || 0;
            updatedData.voteCount = details.vote_count || 0;
            updatedData.runtime = details.runtime || 0;
            updatedData.status = details.status;
            updatedData.tagline = details.tagline;
            updatedData.description = details.overview;
            updatedData.releaseDate = details.release_date;
            updatedData.releaseYear = details.release_date ? parseInt(details.release_date.split('-')[0]) : 0;

            // Streaming Links - Enhanced Search
            const allProviders = details['watch/providers']?.results || {};
            const targetRegions = ['US', 'IN', 'GB', 'CA', 'AU']; // Check major English speaking + India
            const linksMap = new Map(); // Use Map to deduplicate by Provider Name + Type

            targetRegions.forEach(region => {
                const regionData = allProviders[region];
                if (!regionData) return;

                ['flatrate', 'rent', 'buy'].forEach(type => {
                    if (regionData[type]) {
                        regionData[type].forEach(p => {
                            // Simplify type: flatrate -> stream
                            const linkType = type === 'flatrate' ? 'stream' : type;
                            const key = `${p.provider_name}|${linkType}`;

                            // Only add if not already present (Prioritize region order US->IN->GB...)
                            if (!linksMap.has(key)) {
                                linksMap.set(key, {
                                    platform: p.provider_name,
                                    url: null, // URLs are usually generic deep links generated by frontend
                                    type: linkType,
                                    icon: p.logo_path
                                });
                            }
                        });
                    }
                });
            });

            const links = Array.from(linksMap.values());
            updatedData.streamingLinks = links;
            console.log(`   📺 Found ${links.length} streaming options (Stream/Rent/Buy).`);

            // 5. Optimization (AI)
            console.log(`   🧠 Generating AI Content (Why Watch, Keywords)...`);

            const completion = await openai.chat.completions.create({
                messages: [{
                    role: "user",
                    content: `Analyze the movie "${details.title}" (${updatedData.releaseYear}).
                    
                    Return a JSON object with:
                    1. "whyWatch": Array of 3 short, punchy strings (max 10 words each) explaining why to watch it (e.g. "Mind-bending plot twists", "Stellar performance by X"). Use emojis at start.
                    2. "keywords": Array of 10 relevant SEO keywords/concepts (lowercase).
                    3. "themes": Array of 5 themes (e.g. "Revenge", "Love", "Space").
                    
                    JSON only.`
                }],
                model: "gpt-4o-mini", // Fast & Cheap
                response_format: { type: "json_object" },
            });

            const aiContent = JSON.parse(completion.choices[0].message.content);

            if (aiContent.whyWatch) updatedData.whyWatch = aiContent.whyWatch;
            if (aiContent.keywords) updatedData.keywords = aiContent.keywords;
            if (aiContent.themes) updatedData.themes = aiContent.themes;
            updatedData.lastOptimized = new Date().toISOString();

            console.log(`   ✨ Optimization Complete.`);

            // 6. Update Database
            console.log(`   💾 Saving repairs to Database...`);

            // We must update by the ORIGINAL ID to ensure we replace the bad row (or update it if simple).
            // But if ID is changing (corrupt -> clean), we might strictly need to DELETE old and INSERT new, or UPDATE if PK allows.
            // Supabase PK is likely 'id' column.

            if (originalId !== correctFullId) {
                console.log(`   🔄 ID Mismatch (Corrupt). Deleting old, Inserting new...`);

                // 1. Insert new correct record
                const { error: insertError } = await supabase
                    .from('movies')
                    .upsert({
                        id: correctFullId,
                        title: details.title,
                        data: updatedData,
                        created_at: new Date().toISOString()
                    });

                if (insertError) {
                    console.error("   ❌ Insert Failed:", insertError);
                    continue;
                }

                // 2. Delete old corrupt record
                const { error: deleteError } = await supabase
                    .from('movies')
                    .delete()
                    .eq('id', originalId);

                if (deleteError) {
                    console.error("   ⚠️ Delete Old Failed (Manual cleanup may be needed):", deleteError);
                } else {
                    console.log("   ✅ Replaced successfully.");
                }

            } else {
                // Simple Update
                const { error: updateError } = await supabase
                    .from('movies')
                    .update({
                        data: updatedData,
                        updated_at: new Date().toISOString() // Assuming schema has this, or just data update
                    })
                    .eq('id', correctFullId);

                if (updateError) {
                    console.error("   ❌ Update Failed:", updateError);
                } else {
                    console.log("   ✅ Updated successfully.");
                }
            }

        } catch (err) {
            console.error(`   ❌ Failed to process movie:`, err.message);
        }
    }

    console.log("\n✅ All repairs completed.");
}

repairMovies();
