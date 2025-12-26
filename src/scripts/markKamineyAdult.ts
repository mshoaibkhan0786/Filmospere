
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_ID = 'tmdb-1188068'; // ID found in previous step

async function markAsAdult() {
    console.log(`Marking movie ${TARGET_ID} as ADULT...`);

    // First fetch to confirm
    const { data: movie, error: fetchError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', TARGET_ID)
        .single();

    if (fetchError || !movie) {
        console.error('Error fetching movie:', fetchError);
        return;
    }

    const updatedData = {
        ...movie.data,
        adult: true,
        // Optional: Update poster if you wanted to, but we'll leave it
    };

    const { error: updateError } = await supabase
        .from('movies')
        .update({ data: updatedData })
        .eq('id', TARGET_ID);

    if (updateError) {
        console.error('Error updating movie:', updateError);
    } else {
        console.log(`✅ Successfully marked "${updatedData.title}" as ADULT.`);
    }
}

markAsAdult();
