
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
    { title: "The Shop Around the Corner", id: "209" },
    { title: "Sullivan's Travels", id: "16305" },
    { title: "His Girl Friday", id: "3085" },
    { title: "Arsenic and Old Lace", id: "212" }
];

async function updateFullDetails(movieTitle: string, tmdbId: string) {
    // Get Full Details + Credits
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbKey}&append_to_response=credits`);
    const tmdb = await res.json();

    if (!tmdb || tmdb.success === false) return;

    // Extract Missing Fields
    const tagline = tmdb.tagline;
    const budget = tmdb.budget;
    const boxOffice = tmdb.revenue;
    const director = tmdb.credits?.crew?.find((c: any) => c.job === 'Director')?.name;
    const writers = tmdb.credits?.crew?.filter((c: any) => ['Screenplay', 'Writer', 'Story'].includes(c.job)).map((c: any) => c.name).join(', ');

    console.log(`Updating ${movieTitle}...`);
    console.log(`- Tagline: ${tagline}`);
    console.log(`- Budget: ${budget}`);
    console.log(`- Writer: ${writers}`);

    // Update DB
    const { data: current } = await supabase.from('movies').select('data').eq('title', movieTitle).single();

    if (current) {
        const newData = {
            ...current.data,
            tagline,
            budget,
            boxOffice,
            director: director || current.data.director, // Keep existing if not found (unlikely)
            writer: writers
        };

        const { error } = await supabase.from('movies').update({ data: newData }).eq('title', movieTitle);
        if (error) console.error('Error:', error);
        else console.log('✅ Success');
    }
}

async function main() {
    for (const m of MOVIES) {
        await updateFullDetails(m.title, m.id);
    }
}

main();
