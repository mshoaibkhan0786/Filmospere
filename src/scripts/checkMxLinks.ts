
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMxLinks() {
    console.log('Checking MX Player links...');

    // Fetch movies. We have to filter in JS because streamingLinks is JSONB in 'data' column
    const { data: movies, error } = await supabase
        .from('movies')
        .select('id, title, data');

    if (error) {
        console.error('Error fetching movies:', error);
        return;
    }

    let count = 0;
    for (const m of movies) {
        const movieData = m.data;
        if (movieData.streamingLinks) {
            const mxLinks = movieData.streamingLinks.filter((l: any) =>
                l.platform.toLowerCase().includes('mx player') ||
                l.platform.toLowerCase().includes('mxplayer')
            );

            if (mxLinks.length > 0) {
                console.log(`Movie: ${m.title} (${m.id})`);
                mxLinks.forEach((l: any) => {
                    console.log(` - Platform: ${l.platform}`);
                    console.log(` - URL: ${l.url}`);
                });
                count++;
                if (count >= 5) break; // Check first 5 only
            }
        }
    }

    if (count === 0) console.log('No MX Player links found in first batch.');
}

checkMxLinks().catch(console.error);
