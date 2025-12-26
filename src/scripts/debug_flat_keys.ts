
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupPath = path.resolve(__dirname, '../../movies_backup.json');

function debugFlat() {
    console.log(`Checking for flat keys in: ${backupPath}`);
    const raw = fs.readFileSync(backupPath, 'utf-8');
    const data = JSON.parse(raw);
    const movies = Array.isArray(data) ? data : (data.movies || []);

    const gb = movies.find((m: any) => (m.title || '').trim().toLowerCase() === 'green book');

    if (gb) {
        console.log("\n--- GREEN BOOK ---");
        console.log("Keys:", Object.keys(gb));
        console.log(`[root.description]: ${gb.description ? 'Present (' + gb.description.length + ')' : 'MISSING'}`);
        console.log(`[root.seoDescription]: ${gb.seoDescription ? 'Present' : 'MISSING'}`);
        console.log(`[data.description]: ${gb.data?.description ? 'Present' : 'MISSING'}`);
        console.log(`[data.seoDescription]: ${gb.data?.seoDescription ? 'Present' : 'MISSING'}`);
    } else {
        console.log("Green Book not found in backup.");
    }
}

debugFlat();
