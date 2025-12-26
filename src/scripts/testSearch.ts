
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function testSearch() {
    // User query: "ye jawani hai deewani"
    const query = "ye jawani hai deewani";

    console.log(`Searching for: "${query}"`);

    const { data, error } = await supabase
        .from('movies')
        .select('title')
        .ilike('title', `%${query}%`);

    if (error) {
        console.error(error);
    } else {
        console.log(`Found ${data.length} results.`);
        if (data.length === 0) {
            console.log("No match found.");
        } else {
            data.forEach(m => console.log(`Match: ${m.title}`));
        }
    }

    // Correct query: "Yeh Jawaani"
    const correctQuery = "Yeh Jawaani";
    console.log(`\nSearching for: "${correctQuery}"`);
    const { data: data2 } = await supabase
        .from('movies')
        .select('title')
        .ilike('title', `%${correctQuery}%`);

    console.log(`Found ${data2?.length} results.`);
    data2?.forEach(m => console.log(`Match: ${m.title}`));
}

testSearch();
