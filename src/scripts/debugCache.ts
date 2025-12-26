
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugCache() {
    console.log(`Fetching home_cache...`);

    const { data, error } = await supabase
        .from('home_cache')
        .select('content')
        .eq('id', 'home_feed')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        const content = data.content;
        const sections = content.sections || [];
        let found = false;

        if (sections.length > 0 && sections[0].data.length > 0) {
            const firstMovie = sections[0].data[0];
            console.log('Checking first movie keys:', Object.keys(firstMovie));
            console.log('Sample Description:', firstMovie.description ? 'Present' : 'MISSING');
            console.log('Sample MetaTitle:', firstMovie.metaTitle ? 'Present' : 'MISSING');
        }

        if (!found) console.log('Not found in cache.');
    }
}

debugCache();
