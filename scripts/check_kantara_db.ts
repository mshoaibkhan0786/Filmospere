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

async function checkKantara() {
    console.log('Searching for Kantara...');

    // Search in the 'movies' table inside the 'data' JSON column or title column
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%Kantara%');

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Found ${data.length} entries for Kantara:`);
        data.forEach((movie: any) => {
            const m = movie.data; // The JSONB column
            console.log('---------------------------------------------------');
            console.log('ID:', movie.id);
            console.log('Title:', movie.title);
            console.log('Language (Root):', m.language);
            console.log('Languages (Array):', m.languages);
            console.log('---------------------------------------------------');
        });
    } else {
        console.log('No movie found with title "Kantara"');
    }
}

checkKantara();
