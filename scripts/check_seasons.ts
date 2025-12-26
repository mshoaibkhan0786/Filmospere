
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeasons() {
    const { data: record } = await supabase
        .from('movies')
        .select('data')
        .eq('id', 'tmdb-79352')
        .single();

    if (record && record.data) {
        console.log('Has Seasons Array?', Array.isArray(record.data.seasons) && record.data.seasons.length > 0);
        if (Array.isArray(record.data.seasons)) {
            console.log('Season 1 Episodes:', record.data.seasons[0]?.episodes?.length);
        }
        console.log('Original Title:', record.data.originalTitle);
    } else {
        console.log('Record not found');
    }
}

checkSeasons();
