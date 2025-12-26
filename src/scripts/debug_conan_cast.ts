
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
    console.log("Verifying Varun Dhawan in 'October'...");

    const { data: movies } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', 'October')
        .limit(1);

    if (movies && movies.length > 0) {
        const m = movies[0].data;
        const actor = m.cast?.find((c: any) => c.name.toLowerCase().includes('varun dhawan'));

        if (actor) {
            console.log(`Movie: ${m.title} (${m.releaseYear}) -> Role: "${actor.role}"`);
            console.log(`Is Corrupted (Veer)? ${actor.role === 'Veer' ? 'YES ❌' : 'NO ✅'}`);
        } else {
            console.log(`Movie: ${m.title} -> Varun Dhawan not found in cast.`);
        }
    } else {
        console.log("Movie 'October' not found.");
    }
}

main();
