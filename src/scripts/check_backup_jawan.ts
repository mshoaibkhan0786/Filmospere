
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the backup file - assuming public/movies.json based on common workflow
const backupPath = path.resolve(__dirname, '../../public/movies.json');

function checkBackupJawan() {
    console.log(`Reading backup from: ${backupPath}`);

    if (!fs.existsSync(backupPath)) {
        console.log("Backup file not found at expected path.");
        return;
    }

    try {
        const raw = fs.readFileSync(backupPath, 'utf-8');
        const movies = JSON.parse(raw);

        const jawan = movies.find((m: any) => m.title === 'Jawan' || m.id === '1149325' || m.id === 1149325);

        if (!jawan) {
            console.log("Jawan NOT found in backup.");
            return;
        }

        console.log("\n=== JAWAN DATA (BACKUP) ===");
        console.log(`Title: ${jawan.title}`);
        console.log(`ID: ${jawan.id}`);
        console.log(`\n[Description]:\n${jawan.description}`);
        console.log(`\n[SEO Description]:\n${jawan.seoDescription}`);
        console.log(`\n[Why Watch]:\n${JSON.stringify(jawan.whyWatch, null, 2)}`);
        console.log(`\n[Optimized?]: ${jawan.isOptimized}`);

    } catch (err) {
        console.error("Error reading/parsing backup:", err);
    }
}

checkBackupJawan();
