
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log("🔍 Checking articles for Shutter Island (tmdb-11324)...");

    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, slug, is_published')
        .eq('related_movie_id', 'tmdb-11324');

    if (error) {
        console.error("Error fetching:", error);
        return;
    }

    console.log(`Found ${articles.length} articles.`);
    articles.forEach(a => {
        console.log(`- [${a.is_published ? 'VISIBLE' : 'HIDDEN'}] ${a.title} (Slug: ${a.slug})`);
    });

    // Strategy: Hide the AI duplicate if present
    const aiSlug = 'the-lighthouse-dilemma-unpacking-shutter-island-s-ending';
    const aiArticle = articles.find(a => a.slug === aiSlug);

    if (aiArticle) {
        console.log(`\n⚠️  AI Duplicate found. Attempting to UNPUBLISH (Soft Delete)...`);
        const { error: updateError } = await supabase
            .from('articles')
            .update({ is_published: false, related_movie_id: 'hidden-duplicate' })
            .eq('id', aiArticle.id);

        if (updateError) console.error("Soft delete failed:", updateError);
        else console.log("✅ AI Duplicate hidden successfully.");
    } else {
        console.log("\n✅ No AI Duplicate found!");
    }
}

main();
