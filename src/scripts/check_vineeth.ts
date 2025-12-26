
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkPerson() {
    console.log("Checking for 'Vineeth Radhakrishnan'...");

    // Search in Movies (Cast/Director)
    const { data: movies, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .or('data->>cast.ilike.%Vineeth Radhakrishnan%,data->>director.ilike.%Vineeth Radhakrishnan%')
        .limit(10);

    if (movies && movies.length > 0) {
        console.log(`Found relevant movies: ${movies.length}`);
        console.log(movies[0].title);
    } else {
        console.log("No movies found for this person.");
    }
}

checkPerson();
