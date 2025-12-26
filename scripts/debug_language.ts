
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- START DEBUG ---');
    const { data, error } = await supabase
        .from('movies')
        .select('data')
        .limit(5);

    if (error) {
        console.error(error);
        return;
    }

    if (data && data.length > 0) {
        // Log the keys of the first movie to see structure
        console.log('Keys:', Object.keys(data[0].data));

        data.forEach((row, i) => {
            const m = row.data;
            console.log(`#${i} ID: ${m.id} [${m.title}]`);
            console.log(`   Lang: "${m.language}"`);
            console.log(`   OriginalLang: "${m.original_language}"`); // Check if this key exists
            console.log(`   Tags: ${JSON.stringify(m.tags)}`);
        });
    } else {
        console.log('No data found.');
    }
    console.log('--- END DEBUG ---');
}

inspect();
