
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Use Anon Key for reading

console.log('Supabase URL:', supabaseUrl);
// console.log('Supabase Key:', supabaseKey); 

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMoneyHeist() {
    console.log('Checking Money Heist data...');

    // 1. Search by ID
    const { data: byId, error: errId } = await supabase
        .from('movies')
        .select('*')
        .eq('id', 'tmdb-71446')
        .single();

    if (byId) {
        console.log('Found by ID (tmdb-71446):');
        console.log('- Title:', byId.data.title);
        console.log('- Why Watch (Length):', byId.data.whyWatch?.length);
        console.log('- Why Watch (Content):', byId.data.whyWatch);
    } else {
        console.log('Not found by ID:', errId?.message);
    }

    // 2. Search by Title just in case
    const { data: byTitle, error: errTitle } = await supabase
        .from('movies')
        .select('*')
        .eq('data->>title', 'Money Heist')
        .single();

    if (byTitle) {
        console.log('Found by Title (Money Heist):');
        console.log('- ID:', byTitle.id);
        console.log('- Why Watch (Length):', byTitle.data.whyWatch?.length);
    } else {
        console.log('Not found by Title:', errTitle?.message);
    }
}

checkMoneyHeist();
