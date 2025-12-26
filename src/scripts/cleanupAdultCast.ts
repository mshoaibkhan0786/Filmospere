import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

const SUSPECTS_FILE = path.join(__dirname, 'suspected_adult_actors.json');

async function cleanup() {
    console.log('🚀 Starting Cast Cleanup (Removing Orphans)...');

    if (!fs.existsSync(SUSPECTS_FILE)) {
        console.error('❌ Suspects file not found:', SUSPECTS_FILE);
        return;
    }

    const suspects = JSON.parse(fs.readFileSync(SUSPECTS_FILE, 'utf-8'));
    console.log(`Loaded ${suspects.length} suspected actors.`);

    // 1. Fetch All Active Movies to build Safety Net
    console.log('Fetching active actors from DB...');
    const activeActorNames = new Set<string>();

    let from = 0;
    const batchSize = 1000;
    let more = true;

    while (more) {
        const { data, error } = await supabase
            .from('movies')
            .select('data')
            .range(from, from + batchSize - 1);

        if (error) {
            console.error('Fetch error:', error);
            break;
        }

        if (data && data.length > 0) {
            data.forEach((row: any) => {
                if (row.data.cast && Array.isArray(row.data.cast)) {
                    row.data.cast.forEach((c: any) => {
                        if (c.name) activeActorNames.add(c.name);
                    });
                }
            });
            from += batchSize;
            process.stdout.write('.');
        } else {
            more = false;
        }
    }
    console.log(`\nFound ${activeActorNames.size} active actors in the database.`);

    // 2. Identify Orphans (Suspects NOT in Active Set)
    const orphans = suspects.filter((s: any) => !activeActorNames.has(s.name));

    console.log(`\nAnalysis Results:`);
    console.log(`- Suspected Total: ${suspects.length}`);
    console.log(`- Safe (Found in other movies): ${suspects.length - orphans.length}`);
    console.log(`- ORPHANS (To be deleted): ${orphans.length}`);

    if (orphans.length === 0) {
        console.log('No orphans to delete.');
        return;
    }

    // 3. Delete Orphans from 'cast' table
    console.log(`\nDeleting ${orphans.length} orphaned actors from 'cast' table...`);

    const namesToDelete = orphans.map((o: any) => o.name);
    const deleteChunkSize = 50;

    let deletedCount = 0;
    for (let i = 0; i < namesToDelete.length; i += deleteChunkSize) {
        const chunk = namesToDelete.slice(i, i + deleteChunkSize);
        // Delete by Name matches
        const { error, count } = await supabase
            .from('cast')
            .delete()
            .in('name', chunk);

        if (error) {
            console.error('Error deleting chunk:', error);
        } else {
            // console.log(`Deleted chunk ${i/deleteChunkSize + 1}`);
            // Supabase delete doesn't always return count depending on header, but let's assume success
            process.stdout.write('x');
            deletedCount += chunk.length;
        }
    }

    console.log(`\n\n✅ Cleanup Complete. Removed ~${deletedCount} entries from 'cast' table.`);
}

cleanup().catch(console.error);
