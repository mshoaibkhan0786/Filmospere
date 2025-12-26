
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    console.log('Rewriting Article with Professional Content...');

    const articleSlug = 'hidden-gems-like-the-unhappiest-man-in-town';

    // Professional Copy Definitions
    const professionalContent = [
        {
            title: "The Unhappiest Man in Town",
            year: "1941",
            description: `
                <p>Frank Capra’s influence on cinema is often reduced to "Capra-corn"—sentimental optimism. But <em>The Unhappiest Man in Town</em> (often compared to <em>Meet John Doe</em>) reveals the sharp, cynical edge that makes his work timeless. It isn't merely a comedy about a municipal mix-up; it is a scathing satire on bureaucratic incompetence and the malleability of public opinion.</p>
                <p>The film balances its heavier themes with a light, almost screwball touch, driven by a protagonist who transforms from a passive cog in the machine to a voice of righteous indignation. It argues that happiness isn't found in ignorance, but in the messy, difficult work of confronting the truth.</p>
            `
        },
        {
            title: "The Shop Around the Corner",
            year: "1940",
            description: `
                <p>Ernst Lubitsch’s masterpiece is the undisputed blueprint for the modern romantic comedy, notoriously remade as <em>You’ve Got Mail</em>. Yet, the 1940 original possesses a fragility and melancholy that later adaptations missed entirely. Set in Budapest just before the war, it is as much about economic anxiety and loneliness as it is about romance.</p>
                <p>James Stewart and Margaret Sullavan display a chemistry that is intellectual rather than purely physical. Their bickering is a defense mechanism, hiding a shared vulnerability. This is the "Lubitsch Touch" at its finest: finding the profound humanity in the smallest, most mundane interactions of shop life.</p>
            `
        },
        {
            title: "Sullivan's Travels",
            year: "1941",
            description: `
                <p>Preston Sturges was the rebel of 1940s Hollywood, and this film was his manifesto. It follows a pretentious director who wants to make a "serious" film about suffering, only to discover that what the suffering public essentially needs is to laugh. It is a meta-commentary on the responsibility of the artist.</p>
                <p>The film shifts gears effortlessly from slapstick to melodrama to social realism. Veronica Lake, famously cast against type, provides the grounding soul to Joel McCrea’s naive idealism. The church screening scene remains one of cinema’s most powerful testaments to the communal healing power of comedy.</p>
            `
        },
        {
            title: "His Girl Friday",
            year: "1940",
            description: `
                <p>Howard Hawks took the play <em>The Front Page</em>, switched the lead reporter to a woman, and accidentally created the most electrifying screwball comedy ever made. The dialogue here is a weapon, fired at a machine-gun pace that audiences still struggle to keep up with today.</p>
                <p>Beyond the technical marvel of its overlapping dialogue, the film is a fascinating study of professional respect as the ultimate form of romance. Cary Grant and Rosalind Russell aren't just lovers; they are intellectual equals who thrive on the chaos of the newsroom. It remains a gold standard for pacing and wit.</p>
            `
        },
        {
            title: "Arsenic and Old Lace",
            year: "1944",
            description: `
                <p>Adapted from the hit Broadway play, this film allows Cary Grant to unleash a frantic, physical performance that borders on the manic. It is a pitch-black comedy about murder, insanity, and family secrets, wrapped in the cozy aesthetic of a Brooklyn Halloween.</p>
                <p>The brilliance lies in the contrast: the Brewster aunts are sweetly, terrifyingly oblivious to the morality of their "charity" murders. It turns the macabre into the farcical, proving that true horror often hides behind lace curtains and elderberry wine.</p>
            `
        }
    ];

    // Construct the new content
    let newContent = `
<h2>Why Look Back?</h2>
<p>In an era of algorithm-driven content and CGI spectacles, classic cinema offers something startlingly radical: patience, wit, and humanity. These films didn't rely on spectacle; they relied on scripts so sharp they could cut glass and performances that didn't need post-production enhancement.</p>
<p>We've curated 5 masterpieces that defy the "boring old movie" stereotype. These are films that feel as urgent, funny, and relevant today as they did eighty years ago.</p>
<hr />
`;

    // Loop through and build movie sections
    for (let i = 0; i < professionalContent.length; i++) {
        const item = professionalContent[i];
        console.log(`Processing: ${item.title}`);

        // 1. Fetch Movie to get Slug and Image
        const { data: movieData } = await supabase
            .from('movies')
            .select('*')
            .ilike('title', `%${item.title}%`)
            .limit(1);

        if (!movieData || movieData.length === 0) {
            console.warn(`Movie not found: ${item.title}`);
            continue;
        }

        const movie = movieData[0].data;
        const slug = movie.slug;
        let imageUrl = '';
        if (movie.images && movie.images.length > 0) {
            imageUrl = movie.images[0];
        } else if (movie.posterUrl) {
            imageUrl = movie.posterUrl;
        }

        // 2. Build HTML Section
        newContent += `
<h2>${i + 1}. ${item.title} (${item.year})</h2>
<img src="${imageUrl}" alt="${item.title} Movie Shot" class="article-movie-image" />
${item.description}
<div class="movie-cta-container">
    <a href="/movie/${slug}" class="movie-cta-button">
        <span class="play-icon">▶</span>
        <span>Watch <strong>${item.title}</strong> on Filmospere</span>
    </a>
</div>
`;
    }

    // Add footer
    newContent += `
<hr />
<h2>Final Thoughts</h2>
<p>These films prove that "classic" isn't a synonym for "dated." Whether it's the biting satire of <em>The Unhappiest Man in Town</em> or the breathless wit of <em>His Girl Friday</em>, these stories remind us that the human condition—our folly, our romance, and our need for laughter—hasn't changed a bit.</p>
`;

    // 3. Update DB
    const { error: updateError } = await supabase
        .from('articles')
        .update({ content: newContent })
        .eq('slug', articleSlug);

    if (updateError) {
        console.error('Failed to update article:', updateError);
    } else {
        console.log("Success! Article updated with professional content.");
    }
}

main();
