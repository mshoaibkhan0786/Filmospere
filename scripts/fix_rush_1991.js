
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Logic from update_avatar_2009.js which worked
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Force ANON KEY as likely working one
);

async function fixRush() {
    const jsonPath = path.resolve('C:\\WEB DEV\\Filmospere\\AI DATA\\tmdb-5566.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ JSON file not found:', jsonPath);
        return;
    }

    const newData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const targetId = 'tmdb-5566';

    console.log(`Fixing ${newData.title} (${targetId})...`);

    // 1. Fetch existing to ensure it exists
    const { data: existingRow, error: fetchError } = await supabase
        .from('movies')
        .select('data')
        .eq('id', targetId)
        .single();

    if (fetchError || !existingRow) {
        console.error('❌ Error fetching movie (maybe it does not exist?):', fetchError?.message);
        // If it doesn't exist, we MUST upsert (which might fail if blocked).
        // But audit said it existed.
        return;
    }

    const currentData = existingRow.data;

    // 2. Merge Data
    const updatedData = {
        ...currentData,
        ...newData,
        posterUrl: currentData.posterUrl || newData.posterUrl || '',
        releaseYear: 1991,
        releaseDate: "1991-10-04"
    };

    // 3. Update DB using UPDATE (not upsert)
    const { error: updateError } = await supabase
        .from('movies')
        .update({
            data: updatedData,
            updated_at: new Date().toISOString()
        })
        .eq('id', targetId);

    if (updateError) {
        console.error('❌ Update failed:', updateError.message);
    } else {
        console.log('✅ Successfully updated Rush (1991) in Database via UPDATE.');
    }
}

fixRush();
