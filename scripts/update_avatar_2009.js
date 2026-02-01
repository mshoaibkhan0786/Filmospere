
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateAvatar() {
    console.log('🚀 Repairing Avatar (2009) Data...');

    const jsonPath = path.resolve('C:\\WEB DEV\\Filmospere\\AI DATA\\tmdb-19995.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ JSON file not found:', jsonPath);
        return;
    }

    const newData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const targetId = 'tmdb-19995';

    // 1. Fetch existing data
    const { data: existingRow, error: fetchError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', targetId)
        .single();

    if (fetchError || !existingRow) {
        console.error('❌ Error fetching movie:', fetchError?.message || 'Not found');
        return;
    }

    console.log('✅ Found existing movie:', existingRow.data.title);

    // 2. Merge Data
    const updatedData = {
        ...existingRow.data,
        description: newData.description,
        whyWatch: newData.whyWatch,
        metaTitle: newData.metaTitle,
        metaDescription: newData.metaDescription,
        keywords: newData.keywords,
        // Ensure Title is correct too
        title: newData.title
    };

    // 3. Update DB
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
        console.log('✅ Successfully updated Avatar (2009) in Database!');
        console.log('   - Description Updated');
        console.log('   - Why Watch Updated');
        console.log('   - Meta Tags Updated');
    }
}

updateAvatar();
