const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTable() {
    console.log('Checking "people" table...');
    const { data, error } = await supabase.from('people').select('*').limit(1);

    if (error) {
        console.error('Error checking "people" table:', error.message);
        console.log('Checking "cast" table as fallback...');
        const { data: castData, error: castError } = await supabase.from('cast').select('*').limit(1);
        if (castError) {
            console.error('Error checking "cast" table:', castError.message);
        } else {
            console.log('"cast" table exists. Sample:', castData);
        }
    } else {
        console.log('"people" table exists and is accessible.');
        console.log('Sample data:', data);
    }
}

checkTable();
