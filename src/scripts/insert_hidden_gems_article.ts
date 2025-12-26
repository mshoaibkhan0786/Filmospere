
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    console.log('Inserting "Hidden Gems" Article...');

    const article = {
        title: "5 Hidden Black & White Gems That Will Change How You See Comedy",
        slug: "hidden-gems-like-the-unhappiest-man-in-town",
        excerpt: "Think old movies are boring? Think again. Discover 'The Unhappiest Man in Town' and 4 other forgotten masterpieces that are funnier than modern sitcoms.",
        content: `
<h2>Why Look Back?</h2>
<p>In an era of CGI blockbusters and loud comedies, it's easy to overlook the quiet, sharp wit of the 1940s. But movies like <strong>The Unhappiest Man in Town (1941)</strong> prove that great writing never ages.</p>

<p>Here are 5 hidden gems that deserve a spot on your watchlist today.</p>

<hr />

<h3>1. The Unhappiest Man in Town (1941)</h3>
<p><strong>Genre:</strong> Comedy / Satire<br/><strong>Why Watch:</strong> It's not just a comedy; it's a rebellion. The story follows a shy municipal chief of staff who marries into a warlord's family. Sounds heavy? It's actually hilarious.</p>
<p>The protagonist's journey from a quiet "yes-man" to a whistle-blower standing up against corruption is timeless. It strikes a perfect balance between slapstick humor and biting social commentary.</p>
<p><a href="/movie/the-unhappiest-man-in-town-1941" style="color: #e50914; text-decoration: underline;">Watch The Unhappiest Man in Town on Filmospere &rarr;</a></p>

<h3>2. The Shop Around the Corner (1940)</h3>
<p>Before "You've Got Mail", there was this masterpiece. Two employees at a gift shop can't stand each other, unaware that they are falling in love through anonymous letters. Jimmy Stewart at his absolute best.</p>

<h3>3. Sullivan's Travels (1941)</h3>
<p>A wealthy director wants to make a "serious" film about suffering, so he disguises himself as a hobo. What follows is a profound lesson on why people <em>need</em> comedy to survive hard times.</p>

<h3>4. His Girl Friday (1940)</h3>
<p>The dialogue in this movie moves at the speed of light. If you think old movies are slow, try keeping up with Cary Grant and Rosalind Russell in this newsroom screwball comedy.</p>

<h3>5. Arsenic and Old Lace (1944)</h3>
<p>A drama critic discovers his sweet, elderly aunts have a dark secret in the basement. It’s dark comedy before dark comedy existed. Cary Grant’s reaction shots alone are worth the runtime.</p>

<hr />

<h2>Final Thoughts</h2>
<p>These films aren't just "good for their time"—they are genuinely great pieces of entertainment. Start with <em>The Unhappiest Man in Town</em> and work your way down. You might just find your new favorite genre.</p>
        `,
        image_url: "https://image.tmdb.org/t/p/w1280/8Vt6mNqx4qv3k5Yt1uHqhGkZ6y.jpg", // Using a classic looking poster or backdrop if available, fallback to Unhappiest Man poster
        category: "Lists",
        author: "Filmospere Team",
        // published_at removed, relying on created_at
        is_published: true,
        related_movie_id: "tmdb-737169", // The Unhappiest Man in Town
        // seo columns removed as they are not in the schema
        tags: ["classic comedy", "The Unhappiest Man in Town", "black and white movies", "hidden gems", "old movies", "1941 movies"]
    };

    const { data, error } = await supabase
        .from('articles')
        .insert(article)
        .select();

    if (error) {
        console.error('Error inserting article:', error);
    } else {
        console.log('Success! Article inserted with ID:', data[0].id);
    }
}

main();
