
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });


const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const tmdbToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';


if (!supabaseUrl || !supabaseKey || !tmdbToken) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSacredGames() {
    // 1. Search for Sacred Games
    const searchUrl = 'https://api.themoviedb.org/3/search/tv?query=Sacred%20Games&include_adult=false&language=en-US&page=1';
    const searchRes = await fetch(searchUrl, {
        headers: {
            Authorization: `Bearer ${tmdbToken}`,
            accept: 'application/json',
        }
    });
    const searchData = await searchRes.json();

    // Find the 2018 match
    const show = searchData.results?.find((s: any) => s.first_air_date?.startsWith('2018'));

    if (!show) {
        console.error('Could not find Sacred Games (2018) in TMDB search results.');
        return;
    }

    console.log(`Found Show: ${show.name} (ID: ${show.id})`);

    // 2. Fetch Details to get Spoken Languages
    const detailsUrl = `https://api.themoviedb.org/3/tv/${show.id}?language=en-US`;
    const detailsRes = await fetch(detailsUrl, {
        headers: {
            Authorization: `Bearer ${tmdbToken}`,
            accept: 'application/json',
        }
    });
    const details = await detailsRes.json();

    const languages = details.spoken_languages?.map((l: any) => l.english_name) || [];
    const rootLang = details.original_language === 'hi' ? 'Hindi' : 'English'; // Fallback mapping

    console.log('Correct Languages:', languages);

    // 3. Update Supabase
    // We target the specific broken ID: tmdb-79352
    const targetId = 'tmdb-79352';

    // Fetch current data to preserve other fields
    const { data: current, error: fetchError } = await supabase
        .from('movies')
        .select('data')
        .eq('id', targetId)
        .single();

    if (fetchError || !current) {
        console.error('Error fetching Supabase record:', fetchError);
        return;
    }

    const updatedData = {
        ...current.data,
        languages: languages,
        language: languages[0] || rootLang // Update root language in data JSON too if needed
    };

    const { error: updateError } = await supabase
        .from('movies')
        .update({
            data: updatedData
        })

        .eq('id', targetId);

    if (updateError) {
        console.error('Update Failed:', updateError);
    } else {
        console.log(`Successfully updated Sacred Games (${targetId}) with languages: ${languages.join(', ')}`);
    }
}

fixSacredGames();
