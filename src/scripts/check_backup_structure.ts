
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupPath = path.resolve(__dirname, '../../movies_backup.json');

function checkBackupStructure() {
    console.log(`Inspecting structure of: ${backupPath}`);

    if (!fs.existsSync(backupPath)) {
        console.log("File not found.");
        return;
    }

    try {
        const raw = fs.readFileSync(backupPath, 'utf-8');
        const movies = JSON.parse(raw);
        const list = Array.isArray(movies) ? movies : (movies.movies || []);

        const jawan = list.find((m: any) => m.title === 'Jawan' || m.data?.title === 'Jawan');

        if (!jawan) {
            console.log("Jawan not found.");
            return;
        }

        console.log("\n=== JAWAN OBJECT KEYS ===");
        console.log(Object.keys(jawan));

        if (jawan.data) {
            console.log("\n=== JAWAN.DATA KEYS ===");
            console.log(Object.keys(jawan.data));
            console.log(`\n[data.description]: ${jawan.data.description ? 'Present' : 'Missing'}`);
            console.log(`[data.seoDescription]: ${jawan.data.seoDescription ? 'Present' : 'Missing'}`);
            if (jawan.data.seoDescription) {
                console.log(`Preview: ${jawan.data.seoDescription.substring(0, 50)}...`);
            }
        } else {
            console.log("\n[root.description]:", jawan.description);
            console.log("[root.seoDescription]:", jawan.seoDescription);
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

checkBackupStructure();
