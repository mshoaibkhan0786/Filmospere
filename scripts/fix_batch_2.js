
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Using ANON Key as established working pattern
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBatch2() {
    const filesToFix = [
        'tmdb-10160.json', // Big Brother
        'tmdb-30981.json'  // Monster
    ];

    for (const file of filesToFix) {
        const filePath = path.join('C:\\WEB DEV\\Filmospere\\AI DATA', file);

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`\nUpdating DB for Movie ID: ${jsonData.id} (${jsonData.title})...`);

        // Fetch existing movie data
        const { data: existingMovie, error: fetchError } = await supabase
            .from('movies')
            .select('data')
            .eq('id', jsonData.id)
            .single();

        if (fetchError) {
            console.error(`Error fetching movie ${jsonData.id}:`, fetchError.message);
            continue;
        }

        // Merge data
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
            console.error(`Error updating DB for ${jsonData.id}:`, updateError.message);
        } else {
            console.log(`✅ Successfully fixed ${jsonData.title} (${jsonData.id})!`);
        }
    }
}

fixBatch2();
