
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkBackupTables() {
    console.log("Checking for backup tables...");

    // Try to fetch from potential backup table names
    const backupNames = ['movies_backup', 'movies_old', 'movies_archive', 'backup_movies'];

    for (const name of backupNames) {
        const { count, error } = await supabase.from(name).select('*', { count: 'exact', head: true });
        if (!error) {
            console.log(`FOUND TABLE: '${name}' with ${count} rows.`);
        } else {
            // console.log(`Table '${name}' not accessible:`, error.message);
        }
    }
}

checkBackupTables();
