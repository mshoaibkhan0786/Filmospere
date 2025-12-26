
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

async function restoreSEO() {
    console.log("Starting Reliable Sequential SEO Restoration...");

    if (!fs.existsSync(backupPath)) {
        console.error("Backup file not found!");
        return;
    }

    const raw = fs.readFileSync(backupPath, 'utf-8');
    const backupData = JSON.parse(raw);
    const backupMovies = Array.isArray(backupData) ? backupData : (backupData.movies || []);
    console.log(`Loaded ${backupMovies.length} movies from backup.`);

    // Pre-fetch DB map for faster lookups (Title -> ID)
    const { data: dbMovies } = await supabase.from('movies').select('id, title, data');
    const dbMap = new Map();
    dbMovies?.forEach(m => {
        dbMap.set((m.title || '').toLowerCase().trim(), m);
        dbMap.set(m.id, m); // Also map by ID
    });

    let updated = 0;
    let skipped = 0;

    for (const bMovie of backupMovies) {
        const bData = bMovie.data || {};

        // Skip if nothing to restore
        if (!bData.description && !bData.seoDescription && !bData.whyWatch) {
            skipped++;
            continue;
        }

        // Find match in DB
        let match = dbMap.get(bMovie.id);
        if (!match) {
            match = dbMap.get((bMovie.title || '').toLowerCase().trim());
        }

        if (!match) {
            // console.log(`No match for: ${bMovie.title}`);
            skipped++;
            continue;
        }

        // Check if DB already has data (don't overwrite good data with bad, but user said DB is empty)
        // We will overwrite if backup has SEO Description and DB doesn't (or DB is short)

        // Prepare patch
        const newData = {
            ...match.data,
        };

        let changed = false;

        // Restore SEO Description if present in backup (regardless of DB state, trusting backup handles the "ai data")
        if (bData.seoDescription) {
            // Only update if different? Or just force update. 
            // Lets check if DB is missing it or strictly different. 
            // The user wants backup data.
            if (match.data.seoDescription !== bData.seoDescription) {
                newData.seoDescription = bData.seoDescription;
                newData.isOptimized = true;
                changed = true;
            }
        }

        // FORCE Restore description if present in backup
        // Removing the (< 50) check because user claims backup has the "ai data"
        if (bData.description) {
            if (match.data.description !== bData.description) {
                newData.description = bData.description;
                changed = true;
            }
        }

        if (bData.whyWatch && bData.whyWatch.length > 0) {
            // Simple JSON stringify comparison or just length check to avoid deep equal cost
            if (JSON.stringify(match.data.whyWatch) !== JSON.stringify(bData.whyWatch)) {
                newData.whyWatch = bData.whyWatch;
                changed = true;
            }
        }

        if (bData.metaTitle && match.data.metaTitle !== bData.metaTitle) {
            newData.metaTitle = bData.metaTitle;
            changed = true;
        }

        if (bData.keywords && JSON.stringify(match.data.keywords) !== JSON.stringify(bData.keywords)) {
            newData.keywords = bData.keywords;
            changed = true;
        }

        if (changed) {
            const { error } = await supabase
                .from('movies')
                .update({ data: newData })
                .eq('id', match.id);

            if (!error) {
                updated++;
                if (updated % 50 === 0) process.stdout.write('.');
            } else {
                console.error(`Error updating ${match.title}:`, error.message);
            }
        } else {
            skipped++;
        }
    }

    console.log(`\n\n--- DONE ---`);
    console.log(`Movies Updated: ${updated}`);
    console.log(`Skipped (No match / No better data): ${skipped}`);
}

restoreSEO();
