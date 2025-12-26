
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    console.log('Updating Article Content...');

    // 1. Fetch the specific article
    const articleSlug = 'hidden-gems-like-the-unhappiest-man-in-town';
    const { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', articleSlug)
        .limit(1);

    if (fetchError || !articles || articles.length === 0) {
        console.error('Article not found:', fetchError);
        return;
    }

    let content = articles[0].content;
    console.log('Original content length:', content.length);

    // 2. Change Headings H3 -> H2 (for numbered list items 1-5)
    // Matches <h3>1. ...</h3>, <h3>2. ...</h3> etc.
    content = content.replace(/<h3>(\d+\..*?)<\/h3>/g, '<h2>$1</h2>');
    console.log('Updated numbered headings from H3 to H2.');

    // 3. Fetch Slugs & Add Links
    const moviesToLink = [
        { title: "The Shop Around the Corner", anchor: "Jimmy Stewart at his absolute best.</p>" },
        { title: "Sullivan's Travels", anchor: "comedy to survive hard times.</p>" },
        { title: "His Girl Friday", anchor: "newsroom screwball comedy.</p>" },
        { title: "Arsenic and Old Lace", anchor: "reaction shots alone are worth the runtime.</p>" }
    ];

    for (const movie of moviesToLink) {
        // Fetch movie to get the correct slug
        const searchTitle = movie.title.split(' (')[0]; // Remove year if present in title field just in case
        const { data: movieData } = await supabase
            .from('movies')
            .select('data')
            .ilike('title', `%${searchTitle}%`)
            .limit(1);

        if (movieData && movieData.length > 0) {
            const slug = movieData[0].data.slug;
            const linkHtml = `<p><a href="/movie/${slug}" style="color: #e50914; text-decoration: underline;">Watch ${movie.title} on Filmospere &rarr;</a></p>`;

            if (content.includes(movie.anchor)) {
                // Prevent duplicate links if script is run multiple times
                if (!content.includes(linkHtml)) {
                    content = content.replace(movie.anchor, `${movie.anchor}\n${linkHtml}`);
                    console.log(`Added link for: ${movie.title}`);
                } else {
                    console.log(`Link already exists for: ${movie.title}`);
                }
            } else {
                console.warn(`Could not find anchor text for: ${movie.title}`);
            }
        } else {
            console.warn(`Movie not found in DB: ${movie.title}`);
        }
    }

    // 4. Update the DB
    const { error: updateError } = await supabase
        .from('articles')
        .update({ content: content })
        .eq('slug', articleSlug);

    if (updateError) {
        console.error('Failed to update article:', updateError);
    } else {
        console.log("Success! Article content updated.");
    }
}

main();
