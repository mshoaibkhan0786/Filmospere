
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Using the Anon key since it's the one known to work
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixGhost() {
    const filePath = String.raw`C:\WEB DEV\Filmospere\AI DATA\tmdb-1164621.json`;

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    console.log(`Updating DB for Movie ID: ${jsonData.id} (${jsonData.title})...`);

    // Fetch existing movie data to preserve other fields
    const { data: existingMovie, error: fetchError } = await supabase
        .from('movies')
        .select('data')
        .eq('id', jsonData.id)
        .single();

    if (fetchError) {
        console.error('Error fetching movie:', fetchError);
        return;
    }

    // Merge the new AI data with existing data
    const updatedData = {
        ...existingMovie.data,
        description: jsonData.description,
        whyWatch: jsonData.whyWatch,
        metaTitle: jsonData.metaTitle,
        metaDescription: jsonData.metaDescription,
        keywords: jsonData.keywords,
        language: jsonData.language
    };

    const { error: updateError } = await supabase
        .from('movies')
        .update({ data: updatedData })
        .eq('id', jsonData.id);

    if (updateError) {
        console.error('Error updating DB:', updateError);
    } else {
        console.log('✅ Successfully fixed Ghost (tmdb-1164621)!');
    }
}

fixGhost();
