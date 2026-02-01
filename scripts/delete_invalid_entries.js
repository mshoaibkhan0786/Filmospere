
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteMovies() {
    const idsToDelete = ['tmdb-2022', 'tmdb-65820'];

    for (const id of idsToDelete) {
        console.log(`Deleting ID from Database: ${id}...`);

        // Delete from Supabase
        const { error } = await supabase
            .from('movies')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`Error deleting ${id}:`, error.message);
        } else {
            console.log(`✅ Deleted ${id} from DB.`);
        }

        // Delete JSON file
        const filePath = path.join('C:\\WEB DEV\\Filmospere\\AI DATA', `${id}.json`);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`✅ Deleted file: ${filePath}`);
            } catch (err) {
                console.error(`Error deleting file ${filePath}:`, err);
            }
        } else {
            console.log(`File not found (already deleted?): ${filePath}`);
        }
    }
}

deleteMovies();
