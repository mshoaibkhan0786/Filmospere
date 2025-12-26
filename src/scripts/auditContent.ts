
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

async function checkSuspects() {
    console.log('Searching for suspect movies...');

    const queries = [
        'Kissing', 'Chimneys', // Breaking it down
        'Night and the Moment',
        'Country Doctor'
    ];

    for (const q of queries) {
        const { data, error } = await supabase
            .from('movies')
            .select('id, title, data')
            .ilike('title', `%${q}%`)
            .limit(5);

        if (data && data.length > 0) {
            console.log(`\n--- Matches for "${q}" ---`);
            data.forEach(m => {
                console.log(`Title: ${m.title}`);
                console.log(`  ID: ${m.id}`);
                console.log(`  Adult: ${m.data.adult}`);
                console.log(`  Genres: ${JSON.stringify(m.data.tags)}`);
                console.log(`  Overview: ${m.data.description?.substring(0, 100)}...`);
            });
        }
    }
}

checkSuspects().catch(console.error);
