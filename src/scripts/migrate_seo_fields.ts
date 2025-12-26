
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Setup Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
    console.log("🚀 Starting SEO Field Migration & Reset...");

    let totalUpdated = 0;
    let page = 0;
    const pageSize = 50;

    while (true) {
        console.log(`Processing batch ${page}...`);
        const { data: movies, error } = await supabase
            .from('movies')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("Fetch error:", error);
            break;
        }

        if (!movies || movies.length === 0) break;

        const updates = movies.map(m => {
            const data = { ...m.data };
            let changed = false;

            // 1. Migrate seoDescription -> metaDescription
            if (data.seoDescription) {
                if (!data.metaDescription) {
                    data.metaDescription = data.seoDescription;
                }
                delete data.seoDescription;
                changed = true;
            }

            // 2. Reset isOptimized -> false
            // (User request: "make the isoptimised false for all movies")
            // only change if it's not already false
            if (data.isOptimized !== false) {
                data.isOptimized = false;
                changed = true;
            }

            if (changed) {
                return {
                    id: m.id,
                    title: m.title, // Required for upsert matching if PK is composite (it's not here, but safe)
                    data: data
                };
            }
            return null;
        }).filter(Boolean);

        if (updates.length > 0) {
            const { error: upsertError } = await supabase
                .from('movies')
                .upsert(updates);

            if (upsertError) {
                console.error("Upsert error:", upsertError);
            } else {
                totalUpdated += updates.length;
                process.stdout.write(`✅ Updated ${updates.length} rows.\n`);
            }
        } else {
            console.log("No changes needed in this batch.");
        }

        if (movies.length < pageSize) break;
        page++;
    }

    console.log(`\n🎉 Migration Complete. Total updated: ${totalUpdated}`);
}

migrate();
