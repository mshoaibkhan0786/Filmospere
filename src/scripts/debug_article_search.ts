
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    const movieTitle = "The Shop Around the Corner";
    // const movieTitle = "Sullivan's Travels";

    console.log(`Checking articles for title: "${movieTitle}"`);

    // 1. Fetch content of the "Hidden Gems" article to see what we are searching against
    const { data: articles } = await supabase
        .from('articles')
        .select('slug, title, content')
        .ilike('title', '%Hidden%'); // Grab the hidden gems article

    if (!articles || articles.length === 0) {
        console.error("Could not find Hidden Gems article!");
        return;
    }

    const article = articles[0];
    console.log(`\nFound Article: ${article.title}`);
    console.log(`Snippet of content: ${article.content.substring(0, 200)}...`);

    const index = article.content.indexOf(movieTitle);
    console.log(`\nDoes exact title substring exist in content? ${index !== -1}`);
    if (index !== -1) {
        console.log(`Context around match: "...${article.content.substring(index - 20, index + movieTitle.length + 20)}..."`);
    }

    // 2. Run the actual query from ArticleService
    console.log('\nRunning Supabase Query...');
    const { data, error } = await supabase
        .from('articles')
        .select('title, slug')
        .ilike('content', `%${movieTitle}%`)
        .limit(3);

    if (error) {
        console.error("Query Error:", error);
    } else {
        console.log(`Query returned ${data?.length} results.`);
        data?.forEach(d => console.log(` - ${d.title} (${d.slug})`));
    }
}

main();
