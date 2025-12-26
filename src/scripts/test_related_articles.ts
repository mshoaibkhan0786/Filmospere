
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Testing Related Articles Logic (Standalone)...");

    // Test Case
    const dummyId = 'dummy-id-123';
    const movieTitle = 'Shutter Island';

    console.log(`Searching for articles related to ID: ${dummyId} OR Title: "${movieTitle}"`);

    // Mimicking ArticleService.getArticlesByMovieId logic
    let query = supabase
        .from('articles')
        .select('*')
        .eq('is_published', true);

    if (movieTitle) {
        // Match if related_movie_id matches OR if the content/title mentions the movie title
        query = query.or(`related_movie_id.eq.${dummyId},title.ilike.%${movieTitle}%,content.ilike.%${movieTitle}%`);
    } else {
        query = query.eq('related_movie_id', dummyId);
    }

    const { data: articles, error } = await query.limit(3);

    if (error) {
        console.error("❌ Query Error:", error);
    } else if (articles && articles.length > 0) {
        console.log(`✅ Success! Found ${articles.length} articles.`);
        articles.forEach(a => console.log(`- ${a.title} (MovieID: ${a.related_movie_id})`));
    } else {
        console.log("❌ No articles found. Logic might need adjustment or data is missing.");
    }
}

main();
