import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixKantaraForce() {
    const id = 'tmdb-858485';
    console.log(`Fetching ${id}...`);

    const { data: row, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    const movie = row.data;
    console.log('Current Data:', JSON.stringify(movie.languages));
    console.log('Root Language:', movie.language);

    // Analyze First Char
    if (movie.languages && movie.languages.length > 0) {
        const first = movie.languages[0];
        console.log(`First lang char code 0: ${first.charCodeAt(0)}`);
    }

    // FORCE FIX
    movie.languages = ['Kannada'];
    console.log('Setting to:', movie.languages);

    const { error: updateError } = await supabase
        .from('movies')
        .update({ data: movie })
        .eq('id', id);

    if (updateError) {
        console.error('Update failed:', updateError);
    } else {
        console.log('Update success!');
    }
}

fixKantaraForce();
