
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use Service Key if available, otherwise Anon (inserts work with Anon usually)
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const article = {
    slug: 'shutter-island-ending-explained',
    title: 'The Final Choice: To Live as a Monster or Die as a Good Man?',
    excerpt: 'Shutter Island Ending Explained: Validating the truth about Andrew Laeddis and the ambiguous final line.',
    image_url: 'https://image.tmdb.org/t/p/original/U8QRD7jvTXEYsUXq74IFKaSiL5.jpg', // Extracted from Movie Page (Correct)
    author: 'Filmosphere Editor',
    category: 'Ending Explained',
    tags: ['Psychological Thriller', 'Leonardo DiCaprio', 'Martin Scorsese', 'Mind Bending'],
    related_movie_id: 'tmdb-11324', // Correct ID from DB
    is_published: true,
    created_at: new Date().toISOString(),
    meta_title: "Shutter Island Ending Explained: The Final Choice",
    meta_description: "Was Teddy Daniels real? We break down the twist ending of Shutter Island.",
    keywords: "shutter island, leonardo dicaprio, ending explained",
    content: `
Martin Scorsese’s *Shutter Island* is a masterclass in psychological misdirection. For 138 minutes, we follow U.S. Marshal Teddy Daniels (Leonardo DiCaprio) as he investigates the disappearance of Rachel Solando. But in the film's shattering climax, the truth is revealed: Teddy Daniels does not exist.

He is Andrew Laeddis, a patient at Ashecliffe Hospital, and the entire "investigation" was an elaborate role-play designed by Dr. Cawley (Ben Kingsley) to break him out of his violent delusion.

## The Twist Explained

Andrew Laeddis was a U.S. Marshal, but he suffered a psychotic break after tragically failing to protect his family. His wife, Dolores (Michelle Williams), who was mentally ill, drowned their three children. In a fit of grief and rage, Andrew killed her.

Unable to cope with this horrific reality, his mind fractured. He created the persona of "Teddy Daniels," a hero hunting the man (Laeddis) who "killed" his wife in a fire. This narrative allowed him to be the victim and the avenger, rather than the monster.

### The Clues Were There

- **The Fire:** Teddy is terrified of fire, hallucinating it frequently. Fire symbolizes the reality he is burning away.
- **The Water:** Water, the element of his children's death, makes him physically ill (seasickness to the island, the rain).
- **The Anagrams:** "Edward Daniels" is an anagram for "Andrew Laeddis". "Rachel Solando" is an anagram for "Dolores Chanal".

> "You're a rat in a maze, Teddy."

## The Ambiguous Final Line

The movie ends with the doctors believing the treatment failed. They think Andrew has regressed back into "Teddy." But directly before the lobotomy surgery, Andrew turns to his partner Chuck (actually his doctor, Sheehan) and says the most critical line of the film:

> "which would be worse - to live as a monster, or to die as a good man?"

### Acceptance, Not Regression

This line proves **the treatment worked**. Andrew *knows* he is Andrew. He knows that if he admits this, he has to live with the guilt of his children's death (living as a monster).

Instead, he **chooses** to pretend he has regressed. By acting like Teddy again, he forces the doctors to lobotomize him. He chooses to "die" (erase his mind) believing he is a good man, rather than live in the agony of his true memories.

It is a tragic, conscious suicide of the self.
  `
};

async function seed() {
    console.log('Inserting article...');

    // CLEANUP skipped to verify restoration first

    // Check if exists
    const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', article.slug)
        .maybeSingle();

    if (existing) {
        console.log('Article already exists, updating...');
        const { error } = await supabase
            .from('articles')
            .update(article)
            .eq('id', existing.id);

        if (error) console.error('Update failed:', error);
        else console.log('Update success!');
    } else {
        const { error } = await supabase
            .from('articles')
            .insert(article);

        if (error) {
            console.error('Insert failed!');
            console.error('Message:', error.message);
            console.error('Details:', error.details);
            console.error('Code:', error.code);
        } else console.log('Insert success!');
    }
}

seed();
