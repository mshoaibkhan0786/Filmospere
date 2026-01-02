import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHaikyuu() {
    console.log('Fetching Haikyu!! data...');
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .or('id.eq.haikyu-2014,data->>slug.eq.haikyu-2014')
        .single();

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    if (data) {
        console.log('Found ID:', data.id);
        console.log('--- Raw Data Keys ---');
        console.log(Object.keys(data.data));
        console.log('--- Checking for Creator Fields ---');
        console.log('director:', data.data.director);
        console.log('creator:', data.data.creator);
        console.log('creators:', data.data.creators);
        console.log('created_by:', data.data.created_by);
        console.log('createdBy:', data.data.createdBy);
    } else {
        console.log('Movie not found');
    }
}

checkHaikyuu();
