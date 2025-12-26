
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const slugId = 'shah-rukh-khan-35742';
    const tmdbId = 'tmdb-person-35742';
    const simpleId = '35742';

    console.log(`Testing Queries for Actor ID: 35742`);
    console.log('-----------------------------------');

    // 1. Check one movie to see cast format
    console.log("1. Inspecting a movie cast structure...");
    const { data: movieDebug, error: movieError } = await supabase
        .from('movies')
        .select('data')
        .ilike('data->>cast', '%Shah Rukh Khan%') // Loose text search to find a movie
        .limit(1);

    if (movieDebug && movieDebug.length > 0) {
        const cast = movieDebug[0].data.cast;
        const srk = cast.find((c: any) => c.name.toLowerCase().includes('shah rukh'));
        console.log("Found SRK in DB:", srk);
    } else {
        console.log("Could not find a movie with SRK via text search.");
    }

    // 2. Test 'contains' query with tmdb-person-ID
    console.log(`\n2. Testing .contains(cast: [{ id: '${tmdbId}' }])...`);
    const start2 = Date.now();
    const { data: data2, error: error2, count: count2 } = await supabase
        .from('movies')
        .select('title', { count: 'exact' })
        .contains('data', { cast: [{ id: tmdbId }] })
        .order('data->releaseYear', { ascending: false })
        .limit(5);

    console.log(`Time: ${Date.now() - start2}ms`);
    if (error2) console.error("Error:", error2);
    else console.log(`Success! Found ${count2} movies. Examples: ${data2?.map(m => m.title).join(', ')}`);

    // 3. Test 'contains' query with slug ID (should fail/return 0)
    console.log(`\n3. Testing .contains(cast: [{ id: '${slugId}' }])...`);
    const start3 = Date.now();
    const { data: data3, error: error3, count: count3 } = await supabase
        .from('movies')
        .select('title', { count: 'exact' })
        .contains('data', { cast: [{ id: slugId }] })
        .limit(5);

    console.log(`Time: ${Date.now() - start3}ms`);
    if (error3) console.error("Error:", error3);
    else console.log(`Success (Expected 0)! Found ${count3} movies.`);

}

main();
