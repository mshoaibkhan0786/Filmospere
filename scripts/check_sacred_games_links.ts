
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLinks() {
    const { data: record } = await supabase
        .from('movies')
        .select('data')
        .eq('id', 'tmdb-79352')
        .single();

    if (!record) {
        console.log('Record not found');
        return;
    }

    const d = record.data;
    console.log('Internal TMDB ID:', d.tmdbId || d.id);
    console.log('Streaming Links:', d.streamingLinks);
    console.log('Title:', d.title);
}

checkLinks();
