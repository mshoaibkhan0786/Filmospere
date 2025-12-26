
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const backupPath = path.resolve(__dirname, '../../movies_backup.json');

async function compareJawan() {
    console.log("=== COMPARING JAWAN IDs ===");

    // 1. Get from Backup
    let backupJawan = null;
    if (fs.existsSync(backupPath)) {
        const raw = fs.readFileSync(backupPath, 'utf-8');
        const backupData = JSON.parse(raw);
        const movies = Array.isArray(backupData) ? backupData : (backupData.movies || []);
        backupJawan = movies.find((m: any) => (m.title || '').toLowerCase() === 'jawan');
    }

    if (backupJawan) {
        console.log(`\n[BACKUP FILE]`);
        console.log(`ID:        '${backupJawan.id}'`);
        console.log(`Title:     ${backupJawan.title}`);
        console.log(`Data Keys: ${Object.keys(backupJawan.data || {})}`);
        console.log(`Desc:      ${backupJawan.data?.description ? 'Present' : 'MISSING'}`);
        console.log(`SEO Desc:  ${backupJawan.data?.seoDescription ? 'Present' : 'MISSING'}`);
    } else {
        console.log("\n[BACKUP FILE] Jawan NOT found.");
    }

    // 2. Get from Supabase
    const { data: dbMovies } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', 'Jawan');

    if (dbMovies && dbMovies.length > 0) {
        const dbJawan = dbMovies[0];
        console.log(`\n[SUPABASE DB]`);
        console.log(`ID:        '${dbJawan.id}'`);
        console.log(`Title:     ${dbJawan.title}`);
        console.log(`Data Keys: ${Object.keys(dbJawan.data || {})}`);
        console.log(`Desc:      ${dbJawan.data?.description ? 'Present' : 'MISSING'}`);
        console.log(`SEO Desc:  ${dbJawan.data?.seoDescription ? 'Present' : 'MISSING'}`);

        // Compare
        if (backupJawan) {
            console.log(`\n--- COMPARISON ---`);
            console.log(`IDs Match?   ${String(backupJawan.id) === String(dbJawan.id) ? 'YES ✅' : 'NO ❌'}`);
        }
    } else {
        console.log("\n[SUPABASE DB] Jawan NOT found.");
    }
}

compareJawan();
