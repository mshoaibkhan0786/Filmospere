
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    console.log('Enhancing Article Content with Images and Buttons...');

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

    // 2. Define Movies to Enhance
    const movies = [
        { title: "The Unhappiest Man in Town", year: "1941" },
        { title: "The Shop Around the Corner", year: "1940" },
        { title: "Sullivan's Travels", year: "1941" },
        { title: "His Girl Friday", year: "1940" },
        { title: "Arsenic and Old Lace", year: "1944" }
    ];

    for (const m of movies) {
        console.log(`Processing: ${m.title}`);

        // A. Fetch Movie Data (for Image & Slug)
        const { data: movieData } = await supabase
            .from('movies')
            .select('*')
            .ilike('title', `%${m.title}%`)
            .limit(1);

        if (!movieData || movieData.length === 0) {
            console.warn(`Movie not found: ${m.title}`);
            continue;
        }

        const movie = movieData[0].data;
        const slug = movie.slug;

        // Pick best backdrop
        let imageUrl = '';
        if (movie.images && movie.images.length > 0) {
            imageUrl = movie.images[0]; // First backdrop
        } else if (movie.posterUrl) {
            imageUrl = movie.posterUrl; // Fallback
        }

        // B. Inject Image after H2
        // Regex: <h2>(\d+\. Title \(Year\))</h2>
        // We need to match the specific title in the H2
        // Note: The previous script changed H3 to H2.

        const h2Regex = new RegExp(`(<h2>\\d+\\.\\s*${escapeRegExp(m.title)}.*?</h2>)`, 'i');

        if (content.match(h2Regex)) {
            // Check if image already exists to avoid duplication
            if (!content.includes(`alt="${m.title} Movie Shot"`)) {
                const imageHtml = `\n<img src="${imageUrl}" alt="${m.title} Movie Shot" class="article-movie-image" />\n`;
                content = content.replace(h2Regex, `$1${imageHtml}`);
                console.log(`  -> Added Image`);
            } else {
                console.log(`  -> Image already present`);
            }
        } else {
            console.warn(`  -> Could not find H2 for ${m.title}`);
        }

        // C. Transform Link to Button
        // Previous script added: <p><a href="/movie/slug"...>Watch ... &rarr;</a></p>
        // We want to replace this whole <p> block with a styled button/card.

        // Exact string used in previous script:
        // Watch ${movie.title} on Filmospere &rarr;
        const linkTextFragment = `Watch ${m.title} on Filmospere`;
        const linkRegex = new RegExp(`<p>\\s*<a[^>]*href="[^"]*${slug}"[^>]*>.*?${escapeRegExp(linkTextFragment)}.*?<\/a>\\s*<\/p>`, 'i');

        if (content.match(linkRegex)) {
            const buttonHtml = `
<div class="movie-cta-container">
    <a href="/movie/${slug}" class="movie-cta-button">
        <span class="play-icon">▶</span>
        <span>Watch <strong>${m.title}</strong> on Filmospere</span>
    </a>
</div>`;
            content = content.replace(linkRegex, buttonHtml);
            console.log(`  -> transformed Link to Button`);
        } else {
            // Fallback: maybe the link text is slightly different or user edited it?
            // Try to find just the anchor tag
            console.warn(`  -> Could not find exact link paragraph to replace for ${m.title}. Checking looser match...`);
        }
    }

    // 3. Update DB
    const { error: updateError } = await supabase
        .from('articles')
        .update({ content: content })
        .eq('slug', articleSlug);

    if (updateError) {
        console.error('Failed to update article:', updateError);
    } else {
        console.log("Success! Article content enhanced.");
    }
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
