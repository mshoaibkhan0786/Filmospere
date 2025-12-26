
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

// Replicating the logic from ArticleService.ts to verify the QUERY correctness
async function getArticlesByMovieId(movieId: string, movieTitle?: string) {
    // Helper to clean title for broader matching
    const getSmartSearchTerm = (title: string) => {
        if (!title) return '';
        let term = title.replace(/^(The|A|An)\s+/i, '');
        term = term.split(/[:\(\)]/)[0];
        return term.trim();
    };

    const searchTerm = movieTitle ? getSmartSearchTerm(movieTitle) : '';
    console.log(`Computed Search Term: "${searchTerm}"`);

    let query = supabase
        .from('articles')
        .select('*')
        .eq('is_published', true);

    // Valid search term? Search by ID OR Content
    if (searchTerm && searchTerm.length > 2) {
        query = query.or(`related_movie_id.eq.${movieId},content.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);
    } else {
        // Fallback: strict ID match only if no good title
        query = query.eq('related_movie_id', movieId);
    }

    const { data, error } = await query
        .order('created_at', { ascending: false }) // Newer first
        .limit(3);

    if (error) {
        throw error;
    }

    return data || [];
}

async function main() {
    console.log("Verifying Fix for Related Articles...");

    // Test Case: "The Shop Around the Corner"
    // This movie does NOT have the direct link (related_movie_id).
    // It relies on Title/Content matching.
    const movieTitle = "The Shop Around the Corner";
    const dummyId = "tmdb-12345"; // Arbitrary ID

    console.log(`Fetching articles for: "${movieTitle}" (ID: ${dummyId})`);

    try {
        const articles = await getArticlesByMovieId(dummyId, movieTitle);

        console.log(`Found ${articles.length} articles.`);

        const targetArticle = articles.find(a => a.title.includes("Hidden Black & White Gems"));

        if (targetArticle) {
            console.log("✅ SUCCESS: Found target article 'Hidden Black & White Gems'");
            console.log(`   - ID: ${targetArticle.id}`);
            console.log(`   - Title: ${targetArticle.title}`);
        } else {
            console.log("❌ FAILURE: Did NOT find the target article.");
            articles.forEach(a => console.log(`   - Found: ${a.title}`));
        }

    } catch (e) {
        console.error("❌ Error running verification:", e);
    }
}

main();
