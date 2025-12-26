
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function verifyDbState() {
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', 'Kapag Tumayo Ang Testigo%');

    if (movies && movies.length > 0) {
        const m = movies[0];
        console.log(`\nCURRENT DB STATE for '${m.title}':`);
        console.log(`- Rating: ${m.data.rating}`);
        console.log(`- Votes: ${m.data.voteCount}`);

        if (m.data.voteCount === 0) {
            console.log("✅ VERIFIED: Fake votes have been wiped. Sync successful.");
        } else {
            console.log("❌ PENDING: Old votes still present.");
        }
    } else {
        console.log("Movie not found.");
    }
}

verifyDbState();
