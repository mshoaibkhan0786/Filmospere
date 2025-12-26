
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
    console.log("Checking SRK Roles in Multiple Movies...");
    console.log("Verifying Zero (2018)...");

    const { data: movies } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', 'Zero')
        .eq('data->>releaseYear', '2018')
        .limit(1);

    if (movies && movies.length > 0) {
        const m = movies[0].data;
        const srk = m.cast?.find((c: any) => c.name.toLowerCase().includes('shah rukh'));
        if (srk) {
            console.log(`Movie: ${m.title} (${m.releaseYear}) -> Role: "${srk.role}"`);
        } else {
            console.log(`Movie: ${m.title} -> SRK not found in cast.`);
        }
    } else {
        console.log("Zero (2018) not found.");
    }
}

main();
