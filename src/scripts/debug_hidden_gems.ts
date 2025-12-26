
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
    console.log("Debugging 'Hidden Gems' Article logic...");

    // 1. Find the article
    const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .ilike('title', '%Hidden Black & White Gems%')
        .single();

    if (articleError || !articleData) {
        console.error("❌ Could not find the 'Hidden Gems' article:", articleError);
        return;
    }

    console.log(`✅ Found Article: "${articleData.title}"`);
    console.log(`   ID: ${articleData.id}`);
    console.log(`   Related Movie ID: ${articleData.related_movie_id}`);
    console.log(`   Created At: ${articleData.created_at}`);

    // 2. Check total article count
    const { count, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true });

    console.log(`total articles count: ${count}`);

    // 3. Simulate ArticleService Logic for "The Shop Around the Corner"
    const movieTitle = "The Shop Around the Corner";

    // Logic from ArticleService.ts
    const getSmartSearchTerm = (title: string) => {
        if (!title) return '';
        let term = title.replace(/^(The|A|An)\s+/i, '');
        term = term.split(/[:\(\)]/)[0];
        return term.trim();
    };

    const searchTerm = getSmartSearchTerm(movieTitle);
    console.log(`\nTesting with Movie Title: "${movieTitle}"`);
    console.log(`Computed Search Term: "${searchTerm}"`);

    // Does content match?
    const content = articleData.content || "";
    const isMatch = content.toLowerCase().includes(searchTerm.toLowerCase());
    console.log(`Content Match Check: ${isMatch ? "✅ MD MATCH" : "❌ NO MATCH"}`);

    if (isMatch) {
        console.log(`Snippet: ...${content.substring(content.toLowerCase().indexOf(searchTerm.toLowerCase()), content.toLowerCase().indexOf(searchTerm.toLowerCase()) + 50)}...`);
    }

    // 4. Check if it's in the top 50 most recent articles
    const { data: recentArticles, error: recentError } = await supabase
        .from('articles')
        .select('id, title, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);

    if (recentError) {
        console.error("❌ Error fetching recent articles:", recentError);
    } else {
        const foundInReference = recentArticles.find(a => a.id === articleData.id);
        if (foundInReference) {
            console.log("✅ The article IS in the top 50 recent articles.");
        } else {
            console.log("❌ The article is NOT in the top 50 recent articles.");
            console.log(`   Most recent: ${recentArticles[0].created_at}`);
            console.log(`   Oldest of top 50: ${recentArticles[recentArticles.length - 1].created_at}`);
        }
    }
}

main();
