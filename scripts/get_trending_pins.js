
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getTrending() {
    console.log('Fetching Top 5 Trending Movies for Pinterest...');
    
    // Logic matches 'trending' in api.ts (Order by voteCount DESC)
    const { data, error } = await supabase
        .from('movies')
        .select('id, data')
        .order('data->voteCount', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    data.forEach((m, index) => {
        const d = m.data;
        console.log(`${index + 1}. [${d.title}] (${d.releaseYear}) - Rating: ${d.rating}`);
        console.log(`   Poster: ${d.posterUrl}`);
        console.log(`   URL: https://filmospere.com/movie/${m.id}`);
        console.log('---');
    });
}

getTrending();
