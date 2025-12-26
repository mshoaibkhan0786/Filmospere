
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVidaamuyarchi() {
    console.log('Searching for "Vidaamuyarchi" (tmdb-949716)...');

    const { data: movieData, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', 'tmdb-949716')
        .maybeSingle();

    if (error) {
        console.error('Error fetching:', error);
    } else if (!movieData) {
        console.log('Movie NOT FOUND in DB.');
    } else {
        console.log('Found match!');
        const output = `ID: ${movieData.id}\nTitle: ${movieData.title}\nData: ${JSON.stringify(movieData.data, null, 2)}`;
        fs.writeFileSync(path.join(__dirname, 'debug_vidaamuyarchi.txt'), output);
        console.log('Output written to debug_vidaamuyarchi.txt');
    }
}

checkVidaamuyarchi();
