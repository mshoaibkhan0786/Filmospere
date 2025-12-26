
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🕵️ Finding Orphaned Actors...');

    // 1. Get all active actor IDs from movie_cast
    let allActiveIds = new Set();
    let page = 0;
    let pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('movie_cast')
            .select('person_id')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Error fetching movie_cast:', error);
            break;
        }
        if (!data || data.length === 0) break;

        data.forEach(d => allActiveIds.add(d.person_id));
        if (data.length < pageSize) break;
        page++;
        if (page % 5 === 0) console.log(`Fetched ${page * pageSize} links...`);
    }

    console.log(`Found ${allActiveIds.size} active actors (linked to movies).`);

    // 2. Find actors NOT in this set
    // We can't fetch ALL actors and check locally efficiently if there are millions.
    // But assuming we have maybe 20k actors?
    // Let's fetch actors in chunks and check.

    let orphans = [];
    page = 0;
    let checkedCount = 0;

    console.log('Scanning cast table...');
    while (true) {
        const { data: actors, error } = await supabase
            .from('cast')
            .select('id, name')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Error fetching cast:', error);
            break;
        }
        if (!actors || actors.length === 0) break;

        for (const actor of actors) {
            if (!allActiveIds.has(actor.id)) {
                orphans.push(actor);
            }
        }

        checkedCount += actors.length;
        if (actors.length < pageSize) break;
        page++;
        if (page % 5 === 0) console.log(`Scanned ${checkedCount} actors...`);
    }

    console.log(`\n🚨 Found ${orphans.length} Orphaned Actors.`);
    if (orphans.length > 0) {
        console.log('Examples:');
        orphans.slice(0, 5).forEach(o => console.log(`- [${o.id}] ${o.name}`));

        // 3. Try Delete
        // Need ID list
        console.log('\n🗑️ Attempting to delete 1 orphan as test...');
        const target = orphans[0];
        const { error: delError } = await supabase.from('cast').delete().eq('id', target.id);

        if (delError) {
            console.error('❌ Delete Failed (Permissions?):', delError.message);
            console.log('You need a valid SERVICE_KEY to delete them.');
        } else {
            console.log('✅ Delete Successful! We can delete the rest.');
            // If success, delete all?
            // split into chunks of 100
        }
    }
}

main();
