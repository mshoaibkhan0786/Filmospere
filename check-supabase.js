const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(__dirname, '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join('=').trim();
        }
    });
} catch (e) {
    console.warn('Could not read .env.local', e.message);
}

const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Checking Supabase Connection...');
console.log('URL:', url ? 'Present' : 'Missing');
console.log('Key:', key ? 'Present' : 'Missing');

if (!url || !key) {
    console.error('Environment variables missing!');
    process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
    try {
        const slug = 'the-making-of-chicken-run-dawn-of-the-nugget-2023';
        const { data, error } = await supabase
            .from('movies')
            .select('id, data')
            .eq('data->>slug', slug)
            .maybeSingle();

        if (error) {
            console.error('Query Failed:', error.message);
        } else if (!data) {
            console.error('Query returned NO DATA for slug:', slug);
        } else {
            console.log('Query SUCCESS! Found ID:', data.id);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

testConnection();
