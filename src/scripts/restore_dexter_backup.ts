
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

async function restoreDexterFromBackup() {
    console.log("Restoring 'Dexter: Resurrection' from backup...");

    if (!fs.existsSync(BACKUP_FILE)) {
        console.error("Backup file not found!");
        return;
    }

    const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
    // Find Dexter in backup
    const backupMovie = backupData.find((m: any) => m.title === 'Dexter: Resurrection');

    if (!backupMovie) {
        console.error("Dexter: Resurrection NOT found in backup file.");
        return;
    }

    console.log(`Found in backup: ${backupMovie.title}`);
    console.log(`Backup TMDB ID: ${backupMovie.tmdb_id || backupMovie.id}`);
    console.log(`Backup Cast Count: ${backupMovie.cast?.length}`);

    // Update DB with backup data (Preserving safe fields logic if needed, but if backup is "gold", we trust it)
    // Actually, user said "I have a backup file". If this file is it, we use it.

    // We need to target the row in DB.
    const { data: currentRows } = await supabase
        .from('movies')
        .select('id')
        .ilike('title', 'Dexter: Resurrection');

    if (currentRows && currentRows.length > 0) {
        const rowId = currentRows[0].id;
        console.log(`Updating DB Row: ${rowId}`);

        // Construct payload from backup
        // Ensure keys match DB structure
        const payload = {
            ...backupMovie,
            // Ensure ID consistency if backup uses different ID key
        };

        // Remove 'id' from payload if it exists, to avoid PK collision or error
        delete payload.id;

        // Important: If backup has "data" wrapper, unwrap it.
        // Assuming movies_backup.json is flat list of Movie objects (data column content).

        const { error } = await supabase
            .from('movies')
            .update({
                data: payload // Overwrite data column with backup object
            })
            .eq('id', rowId);

        if (error) console.error("Restore failed:", error);
        else console.log("Success! Restored from backup.");

    } else {
        console.error("Target row not found in DB.");
    }
}

restoreDexterFromBackup();
