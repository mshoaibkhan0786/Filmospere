
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = ['tv_shows', 'series', 'tv_series', 'shows'];
const targets = ['Balinsasayaw', 'Kulong'];

async function main() {
    console.log('Checking alternative tables...');

    for (const table of tables) {
        console.log(`Checking table: ${table}`);
        const { error } = await supabase.from(table).select('id').limit(1);
        if (!error) {
            console.log(`✅ Table '${table}' EXISTS! Searching content...`);
            for (const t of targets) {
                const { data } = await supabase.from(table).select('*').ilike('title', `%${t}%`); // assuming title field
                if (data && data.length > 0) {
                    console.log(`FOUND in ${table}: ${t}`);
                }
            }
        } else {
            console.log(`❌ Table '${table}' access failed: ${error.message} (or not exist)`);
        }
    }
}

main();
