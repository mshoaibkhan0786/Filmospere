
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRush() {
    console.log('Checking Rush (tmdb-5566) in DB...');
    const { data, error } = await supabase
        .from('movies')
        .select('data')
        .eq('id', 'tmdb-5566')
        .single();

    if (error) {
        console.error('Error fetching:', error.message);
        // If error contains HTML, log it
        if (error.message.includes('<')) console.log('HTML Error detected (Rate Limit?)');
    } else {
        console.log('Current DB Title:', data.data.title);
        console.log('Current DB Excerpt:', data.data.description.substring(0, 50) + '...');
        if (data.data.description.includes('Melbourne')) {
            console.log('⚠️  DB still has TV Show data.');
        } else if (data.data.description.includes('Texas')) {
            console.log('✅ DB has Correct Movie data!');
        }
    }
}

checkRush();
