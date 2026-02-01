
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use Service Key if available, else Anon Key (Delete usually requires Service Key or Owner RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteRush() {
    console.log(`Attempting to DELETE tmdb-5566 from DB...`);

    const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', 'tmdb-5566');

    if (error) {
        console.error('❌ Delete Failed:', error.message);
    } else {
        console.log('✅ Successfully Deleted tmdb-5566 from Supabase.');
    }
}

deleteRush();
