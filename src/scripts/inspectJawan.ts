
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function inspectJawan() {
    console.log('Searching for Jawan...');
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', 'Dhurandhar')
        .limit(1);

    if (error || !data || data.length === 0) {
        console.log('Dhurandhar not found.');
        return;
    }

    const movie = data[0].data || data[0];
    console.log(`Found Dhurandhar (${data[0].id})`);

    console.log(`Title: ${movie.title}`);
    console.log(`Language (Primary): ${movie.language}`);
    console.log(`Budget: ${movie.budget}`);
    console.log(`Box Office: ${movie.boxOffice}`);
    console.log(`Languages (Array): ${JSON.stringify(movie.languages)}`);

    if (movie.streamingLinks) {
        console.log('Streaming Links:');
        movie.streamingLinks.forEach((l: any, i: number) => {
            console.log(` [${i}] Platform: "${l.platform}" | URL: ${l.url} | Type: ${l.type}`);
        });
    } else {
        console.log('No streaming links found.');
    }
}

inspectJawan().catch(console.error);
