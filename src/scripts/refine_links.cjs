
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
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

// Config
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const tmdbToken = process.env.VITE_TMDB_READ_ACCESS_TOKEN || process.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_API_KEY_FALLBACK = '8da2d8399f3af98c4d290b2aaacc602e';
const shouldUseTmdbKey = !tmdbToken;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function refineLinks() {
    console.log("🔍 Scanning for recently repaired movies to refine links...");

    // 4 hours ago
    const timeAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

    const { data: recentMovies, error } = await supabase
        .from('movies')
        .select('*')
        .gt('updated_at', timeAgo)
        .limit(200);

    if (error) {
        console.error("Error fetching movies:", error);
        return;
    }

    if (!recentMovies || recentMovies.length === 0) {
        console.log("✅ No recently updated movies found.");
        return;
    }

    console.log(`⚠️ Found ${recentMovies.length} recently updated movies. checking links...`);

    let updatedCount = 0;

    for (const record of recentMovies) {
        const title = record.title;
        const tmdbId = record.data.id.replace('tmdb-', '');

        // Skip if not TMDB
        if (!record.data.id.startsWith('tmdb-')) continue;

        console.log(`🔧 Checking: "${title}" (${tmdbId})`);

        try {
            const config = {
                params: { append_to_response: 'watch/providers' }
            };

            if (shouldUseTmdbKey) {
                config.params.api_key = TMDB_API_KEY_FALLBACK;
            } else {
                config.headers = { Authorization: `Bearer ${tmdbToken}` };
            }

            const tmdbRes = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, config);
            const details = tmdbRes.data;

            // Extract Links
            const allProviders = details['watch/providers']?.results || {};
            const targetRegions = ['US', 'IN', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT'];
            const linksMap = new Map();

            targetRegions.forEach(region => {
                const regionData = allProviders[region];
                if (!regionData) return;

                ['flatrate', 'rent', 'buy'].forEach(type => {
                    if (regionData[type]) {
                        regionData[type].forEach(p => {
                            const linkType = type === 'flatrate' ? 'stream' : type;
                            const key = `${p.provider_name}|${linkType}`;

                            if (!linksMap.has(key)) {
                                linksMap.set(key, {
                                    platform: p.provider_name,
                                    url: null,
                                    type: linkType,
                                    icon: p.logo_path
                                });
                            }
                        });
                    }
                });
            });

            const newLinks = Array.from(linksMap.values());

            // Compare with existing to see if we improved
            const oldLinks = record.data.streamingLinks || [];

            if (newLinks.length > oldLinks.length) {
                console.log(`   ⬆️  Improved links! ${oldLinks.length} -> ${newLinks.length}`);

                const updatedData = { ...record.data, streamingLinks: newLinks };

                const { error: updateError } = await supabase
                    .from('movies')
                    .update({
                        data: updatedData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', record.id);

                if (updateError) console.error("   ❌ Update Failed:", updateError);
                else updatedCount++;

            } else {
                console.log(`   -  No better links found (${newLinks.length} available).`);
            }

        } catch (err) {
            console.error(`   ❌ Failed to process:`, err.message);
        }
    }

    console.log(`\n✅ Refinement completed. Updated ${updatedCount} movies with better links.`);
}

refineLinks();
