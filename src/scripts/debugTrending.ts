
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrending() {
    console.log('Testing Trending Query...');

    // Test 1: Current Logic (.filter number)
    console.log('\n--- Test 1: .filter("data->releaseYear", "gte", 2024) ---');
    const { data: data1, error: error1 } = await supabase
        .from('movies')
        .select('data->title, data->releaseYear, data->voteCount')
        .not('data->>posterUrl', 'is', null)
        .neq('data->>posterUrl', '')
        .neq('data->>posterUrl', 'N/A')
        .filter('data->releaseYear', 'gte', 2024)
        .order('data->voteCount', { ascending: false })
        .limit(5);

    if (error1) console.error('Error 1:', error1);
    else {
        console.log(`Found ${data1?.length} movies.`);
        data1?.forEach(m => console.log(`${m.title} (${m.releaseYear}) - Votes: ${m.voteCount}`));
    }

    // Test 2: Text Logic (.gte text)
    console.log('\n--- Test 2: .gte("data->>releaseYear", "2024") ---');
    const { data: data2, error: error2 } = await supabase
        .from('movies')
        .select('data->title, data->releaseYear, data->voteCount')
        .not('data->>posterUrl', 'is', null)
        .neq('data->>posterUrl', '')
        .neq('data->>posterUrl', 'N/A')
        .gte('data->>releaseYear', '2024')
        .order('data->voteCount', { ascending: false })
        .limit(5);

    if (error2) console.error('Error 2:', error2);
    else {
        console.log(`Found ${data2?.length} movies.`);
        data2?.forEach(m => console.log(`${m.title} (${m.releaseYear}) - Votes: ${m.voteCount}`));
    }
}

checkTrending();
