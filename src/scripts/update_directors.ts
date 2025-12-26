
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const tmdbKey = '8da2d8399f3af98c4d290b2aaacc602e';

if (!supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl!, supabaseKey!);

const MOVIES = [
    { title: "The Shop Around the Corner", id: "tmdb-209" },
    { title: "Sullivan's Travels", id: "tmdb-16305" },
    { title: "His Girl Friday", id: "tmdb-3085" },
    { title: "Arsenic and Old Lace", id: "tmdb-212" }
];

async function updateDirector(movieTitle: string) {
    // 1. Get TMDB ID by search
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(movieTitle)}`);
    const searchData = await searchRes.json();
    if (!searchData.results?.length) return;
    const tmdbId = searchData.results[0].id;

    // 2. Get Credits
    const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${tmdbKey}`);
    const credits = await creditsRes.json();

    // 3. Find Director
    const director = credits.crew?.find((c: any) => c.job === 'Director')?.name;

    if (director) {
        console.log(`Updated ${movieTitle} -> Director: ${director}`);

        // 4. Update DB
        // We need to update both the top-level 'director' column (if it exists) and the 'data->director' field

        // Fetch current data first to merge
        const { data: current } = await supabase.from('movies').select('data').eq('title', movieTitle).single();

        if (current) {
            const newData = { ...current.data, director: director };
            await supabase.from('movies').update({ data: newData }).eq('title', movieTitle);
        }
    }
}

async function main() {
    for (const m of MOVIES) {
        await updateDirector(m.title);
    }
}

main();
