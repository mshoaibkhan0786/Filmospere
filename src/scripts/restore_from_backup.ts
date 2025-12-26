
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

const IDS_TO_RESTORE = [
    'tmdb-1213076', // Fight Club (2023)
    'tmdb-391062',  // Joker (2016)
    'tmdb-129507',  // Joker (2012)
    'tmdb-48311',   // Parasite (1982)
    'tmdb-87516'    // Oldboy (2013)
];

async function main() {
    console.log("Reading backup file...");
    const backupPath = path.resolve(__dirname, '../../movies_backup.json');

    if (!fs.existsSync(backupPath)) {
        console.error("Backup file not found at:", backupPath);
        return;
    }

    const raw = fs.readFileSync(backupPath, 'utf8');
    const backupMovies = JSON.parse(raw);
    console.log(`Backup contains ${backupMovies.length} movies.`);

    const found = backupMovies.filter((m: any) => IDS_TO_RESTORE.includes(m.id));
    console.log(`Found ${found.length} matching movies in backup.`);

    for (const m of found) {
        console.log(`Restore: ${m.title} (${m.id})...`);

        // Ensure structure fits DB
        // Backup format might be { id:..., data: {...} } OR just { ...data, id:... }
        // Depending on how backup was made. Usually Supabase export is { id, data, ... }

        const row = {
            id: m.id,
            title: m.title,
            data: m.data,
            // Omit created_at to avoid schema issues, or include if needed
        };

        const { error } = await supabase.from('movies').upsert(row);

        if (error) console.error(`   ❌ Error: ${error.message}`);
        else console.log(`   ✅ Restored.`);
    }

    console.log("Done.");
}

main();
