
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkDuplicates() {
    console.log("Checking for duplicates of 'Kapag Tumayo Ang Testigo'...");

    // Fetch ALL matches
    const { data: movies, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .ilike('title', '%Kapag Tumayo%');

    if (error || !movies) {
        console.error("Fetch failed:", error);
        return;
    }

    console.log(`Found ${movies.length} matches:`);
    movies.forEach(m => {
        console.log(`- [${m.id}] ${m.title}`);
        console.log(`  Rating: ${m.data.rating} | Votes: ${m.data.voteCount}`);
        console.log(`  Slug: ${m.data.slug || 'N/A'}`);
    });
}

checkDuplicates();
