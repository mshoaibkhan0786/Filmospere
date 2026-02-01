
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkState() {
    console.log('Checking database state for Scam 1992...');

    // Check by ID
    const { data, error } = await supabase
        .from('movies')
        .select('data')
        .eq('id', 'tmdb-111188')
        .single();

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    if (!data) {
        console.log('Movie NOT FOUND by ID');
        return;
    }

    const cast = data.data.cast || [];
    const pratik = cast.find(c => c.name.includes('Pratik'));
    const hemant = cast.find(c => c.name.includes('Hemant'));

    console.log('\n--- LIVE DB DATA ---');
    console.log('Pratik Image:', pratik ? pratik.imageUrl : 'NOT FOUND');
    console.log('Hemant Image:', hemant ? hemant.imageUrl : 'NOT FOUND');

    // Check if it matches the "Direct Proxy" fix
    if (pratik && pratik.imageUrl.includes('wsrv.nl')) {
        console.log('✅ DB has the Direct Proxy fix.');
    } else {
        console.log('❌ DB has OLD data (Fix was not saved).');
    }
}

checkState();
