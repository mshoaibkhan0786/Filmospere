import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !anonKey) {
    console.error('Missing URL or Anon Key');
    process.exit(1);
}

const supabase = createClient(url, anonKey);

async function checkCounts() {
    console.log('Checking counts...');

    const { count: castCount, error: castError } = await supabase
        .from('cast')
        .select('*', { count: 'exact', head: true });

    if (castError) console.error('Error checking cast:', castError.message);
    else console.log(`Total Cast Members: ${castCount}`);

    const { count: directorCount, error: directorError } = await supabase
        .from('directors')
        .select('*', { count: 'exact', head: true });

    if (directorError) console.error('Error checking directors:', directorError.message);
    else console.log(`Total Directors: ${directorCount}`);
}

checkCounts();
