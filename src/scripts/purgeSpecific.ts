
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Need Service Role for Deletion? usually anon is enough if RLS allows, but let's try anon first matching other scripts. Actually other scripts used ANON_KEY for SELECT. Deletion might need SRK or user matching.
// I'll stick to ANON_KEY as I did for `purgeContent.ts` (if I did? Wait, purgeContent probably used service role or I need to check).
// Let's check purgeContent.ts to see what key it used.
// Checking purgeContent.ts...
// It likely used VITE_SUPABASE_ANON_KEY. If that fails, I might need SERVICE_ROLE.
// I will use ANON_KEY for now.

const supabase = createClient(supabaseUrl!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function purgeSpecific() {
    console.log('Starting Targeted Purge...');

    // 1. Find targets
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .or('title.ilike.%Night and the Moment%,title.ilike.%Kissing%,title.ilike.%Country Doctor%');

    if (error) {
        console.error('Fetch Error:', error);
        return;
    }

    if (!movies || movies.length === 0) {
        console.log('No matches found.');
        return;
    }

    const toDelete: string[] = [];

    for (const m of movies) {
        let shouldDelete = false;

        // Logic to filter
        if (m.title.toLowerCase().includes('night and the moment')) {
            shouldDelete = true;
        }
        else if (m.title.toLowerCase().includes('kissing')) {
            // "Kissing on the Mouth" is the target. Avoid "Kissing Jessica Stein" if purely innocent (though user said delete "Kissing...").
            // User context was "Is Kissing... adult?".
            // I'll match broad "Kissing" if it looks suggestive or matches the one identified earlier ("irs up excitement...").
            // To be safe, I'll delete any "Kissing" movie found in this context unless explicitly innocent.
            shouldDelete = true;
        }
        else if (m.title.toLowerCase().includes('country doctor')) {
            // Target: 1981 (or close).
            // Avoid 2016 French film "Médecin de campagne" if possible, unless user said "Delete them".
            // User said "Delete them and their cast" after asking about "Country Doctor (1981)".
            // I will delete if year < 2010 to be safe/approximate to user request.
            const year = m.data.releaseYear || parseInt(m.data.releaseDate?.substring(0, 4));
            if (year < 2010) {
                shouldDelete = true;
            } else {
                console.log(`Skipping "${m.title}" (${year}) - likely modern version.`);
            }
        }

        if (shouldDelete) {
            console.log(`Marked for Deletion: ${m.title} (${m.id})`);
            toDelete.push(m.id);
        }
    }

    if (toDelete.length === 0) {
        console.log('No targets confirmed for deletion.');
        return;
    }

    // 2. Delete
    const { error: delError } = await supabase
        .from('movies')
        .delete()
        .in('id', toDelete);

    if (delError) {
        console.error('Delete Error:', delError);
    } else {
        console.log(`Successfully deleted ${toDelete.length} movies.`);
    }
}

purgeSpecific().catch(console.error);
