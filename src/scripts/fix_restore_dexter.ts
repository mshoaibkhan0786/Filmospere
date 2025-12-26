
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const BACKUP_FILE = path.resolve(__dirname, '../../movies_backup.json');

async function fixRestoreDexter() {
    console.log("Fixing 'Dexter: Resurrection' restore (Unwrapping data)...");

    if (!fs.existsSync(BACKUP_FILE)) {
        console.error("Backup file not found!");
        return;
    }

    const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
    const backupMovie = backupData.find((m: any) => m.title === 'Dexter: Resurrection');

    if (!backupMovie) {
        console.error("Dexter: Resurrection NOT found in backup file.");
        return;
    }

    console.log(`Found in backup: ${backupMovie.title}`);

    // CRITICAL FIX: Use backupMovie.data, NOT backupMovie
    // The backup structure is { id: ..., data: { ...real_fields... } }
    const correctPayload = backupMovie.data;

    if (!correctPayload) {
        console.error("Backup entry has no 'data' property!");
        console.log("Entry keys:", Object.keys(backupMovie));
        return;
    }

    // Safety check: Does it have the fields we expect?
    console.log(`Payload check - Cast: ${correctPayload.cast?.length}, Poster: ${correctPayload.posterUrl}`);

    // Update DB
    const { data: currentRows } = await supabase
        .from('movies')
        .select('id')
        .ilike('title', 'Dexter: Resurrection'); // Or use ID tmdb-259909 directly if we are sure

    if (currentRows && currentRows.length > 0) {
        const rowId = currentRows[0].id;
        console.log(`Updating DB Row: ${rowId}`);

        const { error } = await supabase
            .from('movies')
            .update({
                data: correctPayload // Flattened correct data
            })
            .eq('id', rowId);

        if (error) console.error("Restore failed:", error);
        else console.log("Success! Restored from backup (Unwrapped).");

    } else {
        console.error("Target row not found in DB.");
    }
}

fixRestoreDexter();
