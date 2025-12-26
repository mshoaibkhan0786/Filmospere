
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchTmdbCast(tmdbId: string) {
    const numericId = tmdbId.replace('tmdb-', '');
    try {
        const url = `https://api.themoviedb.org/3/movie/${numericId}/credits`;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_READ_TOKEN}`
            }
        };
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
        const data = await res.json();
        return data.cast || [];
    } catch (e) {
        console.error(`Failed to fetch credits for ${tmdbId}:`, e);
        return null;
    }
}

async function main() {
    const targetMovies = [
        { title: 'Do Patti', year: '2024' },
        { title: 'Minsara Kanavu', year: '1997' },
        // Add others that might be affected or just general cleanup for Kajol
        { title: 'Dilwale', year: '2015' }, // Validate source
        { title: 'My Name Is Khan', year: '2010' },
        { title: 'Fanaa', year: '2006' },
        { title: 'Baazigar', year: '1993' },
        { title: 'Kuch Kuch Hota Hai', year: '1998' },
        { title: 'Karan Arjun', year: '1995' },
        { title: 'Dilwale Dulhania Le Jayenge', year: '1995' },
        { title: 'Kabhi Khushi Kabhie Gham', year: '2001' },
        { title: 'Gupt: The Hidden Truth', year: '1997' },
        { title: 'Ishq', year: '1997' },
        { title: 'Pyaar Kiya To Darna Kya', year: '1998' },
        { title: 'Pyaar To Hona Hi Tha', year: '1998' },
        { title: 'Hum Aapke Dil Mein Rehte Hain', year: '1999' },
        { title: 'Hote Hote Pyar Ho Gaya', year: '1999' },
        { title: 'Raju Chacha', year: '2000' },
        { title: 'Kuch Khatti Kuch Meethi', year: '2001' },
        { title: 'U Me Aur Hum', year: '2008' },
        { title: 'We Are Family', year: '2010' },
        { title: 'Toonpur Ka Superrhero', year: '2010' }
    ];

    console.log(`Starting Repair for ${targetMovies.length} movies...`);

    for (const target of targetMovies) {
        // Fetch movie by title and Year
        const { data: movies, error } = await supabase
            .from('movies')
            .select('*')
            .ilike('title', target.title)
            .eq('data->>releaseYear', target.year);

        if (error || !movies || movies.length === 0) {
            console.log(`Skipping '${target.title}' (Not found or Error)`);
            continue;
        }

        const movie = movies[0]; // Specific target
        const fullMovieData = movie.data;

        console.log(`\nProcessing: ${fullMovieData.title} (${fullMovieData.releaseYear})`);

        // Fetch Fresh Cast
        const freshCast = await fetchTmdbCast(movie.id);
        if (!freshCast) {
            console.log("-> Skipping update (failed to fetch fresh cast).");
            continue;
        }

        // Rebuild Cast Array
        const updatedCast = freshCast.slice(0, 20).map((c: any) => ({
            id: `tmdb-person-${c.id}`,
            name: c.name,
            role: c.character,
            imageUrl: c.profile_path
        }));

        console.log(`-> Retrieved ${updatedCast.length} cast members.`);
        if (updatedCast.length > 0) {
            console.log(`   Top 1: ${updatedCast[0].name} as "${updatedCast[0].role}"`);
        }

        // Update Supabase
        const updatedData = {
            ...fullMovieData,
            cast: updatedCast
        };

        const { error: updateError } = await supabase
            .from('movies')
            .update({ data: updatedData })
            .eq('id', movie.id);

        if (updateError) {
            console.error("-> Update Failed:", updateError);
        } else {
            console.log("-> Update SUCCESS.");
        }
    }
}

main();
