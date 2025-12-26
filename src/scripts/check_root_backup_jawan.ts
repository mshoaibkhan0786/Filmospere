
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct path to the root backup file found
const backupPath = path.resolve(__dirname, '../../movies_backup.json');

function checkBackupJawan() {
    console.log(`Reading backup from: ${backupPath}`);

    if (!fs.existsSync(backupPath)) {
        console.log("Backup file not found.");
        return;
    }

    try {
        const raw = fs.readFileSync(backupPath, 'utf-8');
        const movies = JSON.parse(raw);

        // Handle array or object structure
        let movieList = Array.isArray(movies) ? movies : (movies.movies || []);

        const jawan = movieList.find((m: any) => m.title === 'Jawan' || m.id === '1149325' || m.id === 1149325);

        if (!jawan) {
            console.log("Jawan NOT found in movies_backup.json.");
            return;
        }

        console.log("\n=== JAWAN DATA (BACKUP FILE) ===");
        console.log(`Title: ${jawan.title}`);
        console.log(`ID: ${jawan.id}`);
        console.log(`\n[Description]:\n${jawan.description}`);
        console.log(`\n[SEO Description]:\n${jawan.seoDescription}`);
        console.log(`\n[Why Watch]:\n${JSON.stringify(jawan.whyWatch, null, 2)}`);

    } catch (err) {
        console.error("Error reading/parsing backup:", err);
    }
}

checkBackupJawan();
