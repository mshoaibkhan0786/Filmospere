
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env/credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectVoteAverage() {
    console.log('Fetching 10 movies to inspect vote_average...');

    const { data, error } = await supabase
        .from('movies')
        .select('id, data')
        .limit(10);

    if (error) {
        console.error('Error fetching movies:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No movies found.');
        return;
    }

    console.log('Sample Data:');
    data.forEach(m => {
        console.log(`ID: ${m.id}`);
        console.log(`Title: ${m.data.title}`);
        console.log(`voteCount: ${m.data.voteCount} (Type: ${typeof m.data.voteCount})`);
        console.log(`rating: ${m.data.rating} (Type: ${typeof m.data.rating})`);
        console.log('---');
    });
}

inspectVoteAverage();
