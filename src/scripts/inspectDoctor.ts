
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

async function inspectDoctor() {
    console.log('Inspecting "Country Doctor"...');

    const { data, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .ilike('title', '%Country Doctor%');

    if (data) {
        data.forEach(m => {
            console.log(`\nTitle: ${m.title}`);
            console.log(`Year: ${m.data.releaseYear}`);
            console.log(`Adult: ${m.data.adult}`);
            console.log(`Genres: ${JSON.stringify(m.data.tags)}`);
            console.log(`Overview: ${m.data.description}`);
        });
    } else {
        console.log('No matches found.');
    }
}

inspectDoctor().catch(console.error);
