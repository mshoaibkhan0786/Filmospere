
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // STRICTLY ANON KEY FOR TESTING

console.log("Using Anon Key:", supabaseKey ? "Yes (Masked)" : "No");

if (!supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function getArticlesByMovieId(movieId: string, movieTitle?: string) {
    console.log(`[Debug] Input Title: "${movieTitle}"`);

    // Helper to clean title for broader matching
    const getSmartSearchTerm = (title: string) => {
        if (!title) return '';
        // 1. Remove "The ", "A ", "An " (case insensitive) at start
        let term = title.replace(/^(The|A|An)\s+/i, '');

        // 2. Take part before colon or parens (e.g. "Movie: The Sequel" -> "Movie")
        term = term.split(/[:\(\)]/)[0];

        return term.trim();
    };

    const searchTerm = movieTitle ? getSmartSearchTerm(movieTitle) : '';
    console.log(`[Debug] Computed Term: "${searchTerm}"`);

    // 1. Primary Fetch: Direct Link
    const { data: directLinks, error: error1 } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .eq('related_movie_id', movieId)
        .limit(3);

    if (error1) {
        console.error('Error fetching direct articles:', error1);
        return [];
    }

    let articles = directLinks || [];
    console.log(`[Debug] Primary found: ${articles.length}`);

    // 2. Secondary Fetch: Content Match
    if (searchTerm && articles.length < 3) {
        console.log(`[Debug] Running Secondary Fetch with ilike %${searchTerm}%`);
        const { data: contentLinks, error: error2 } = await supabase
            .from('articles')
            .select('title, slug')
            .eq('is_published', true)
            .ilike('content', `%${searchTerm}%`)
            .neq('related_movie_id', movieId)
            .limit(3);

        if (error2) {
            console.error("Secondary Error:", error2);
        }

        if (!error2 && contentLinks) {
            console.log(`[Debug] Secondary matches:`, contentLinks.length);
            contentLinks.forEach(a => console.log(` - ${a.title}`));

            // Deduplicate locally
            // const existingIds = new Set(articles.map(a => a.id));
            // const newArticles = (contentLinks).filter(a => !existingIds.has(a.id));
            // articles = [...articles, ...newArticles].slice(0, 3);
        }
    }

    return articles;
}

async function main() {
    // "The Shop Around the Corner"
    // ID: tmdb-209
    await getArticlesByMovieId('tmdb-209', 'The Shop Around the Corner');

    console.log('---');

    // "Sullivan's Travels"
    // ID: tmdb-16305
    await getArticlesByMovieId('tmdb-16305', "Sullivan's Travels");

    console.log('---');

    // "Arsenic and Old Lace"
    // ID: tmdb-212 
    await getArticlesByMovieId('tmdb-212', "Arsenic and Old Lace");
}

main();
