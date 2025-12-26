
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function findZeroRatedHits() {
    console.log("Scanning for high-vote zero-rated movies...");

    // Fetch movies with voteCount > 1000. 
    // We'll filter for rating === 0 in code to be precise because floating point comparisons in DB can be tricky.
    // Or we can use .lte('data->rating', 0) if cast correctly, but let's fetch high votes first.

    // Note: 'data->voteCount' is stored as number in JSONB, usually we need to cast or just fetch and filter.
    // Let's fetch a batch and filter client side for safety.

    // Using a raw query filter for speed if possible
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .gt('data->voteCount', 1000)
        .limit(100);

    if (error) {
        console.error("Fetch failed:", error);
        return;
    }

    if (!movies || movies.length === 0) {
        console.log("No movies found with > 1000 votes in this batch.");
        return;
    }

    const glitched = movies.filter(m => m.data.rating === 0 || m.data.rating === null);

    console.log(`Found ${glitched.length} glitched movies (High Votes, Zero Rating).`);

    glitched.forEach(m => {
        console.log(`- ${m.title} (ID: ${m.id}) | Votes: ${m.data.voteCount} | Rating: ${m.data.rating}`);
    });
}

findZeroRatedHits();
