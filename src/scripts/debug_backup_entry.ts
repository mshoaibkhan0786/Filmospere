
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupPath = path.resolve(__dirname, '../../movies_backup.json');

function debugEntry() {
    console.log(`Reading backup: ${backupPath}`);
    const raw = fs.readFileSync(backupPath, 'utf-8');
    const data = JSON.parse(raw);
    const movies = Array.isArray(data) ? data : (data.movies || []);

    const greenBook = movies.find((m: any) => (m.title || '').trim().toLowerCase() === 'green book');
    const dexter = movies.find((m: any) => (m.title || '').includes('Dexter'));

    console.log("\n--- GREEN BOOK (Backup) ---");
    if (greenBook) {
        console.log(`ID: ${greenBook.id}`);
        console.log(`Title: ${greenBook.title}`);
        console.log(`SEO Desc: ${greenBook.data?.seoDescription ? 'Present (' + greenBook.data.seoDescription.length + ' chars)' : 'MISSING'}`);
        console.log(`Desc: ${greenBook.data?.description ? 'Present' : 'MISSING'}`);
    } else {
        console.log("Not found in backup.");
    }

    console.log("\n--- DEXTER (Backup) ---");
    if (dexter) {
        console.log(`ID: ${dexter.id}`);
        console.log(`Title: ${dexter.title}`);
        console.log(`SEO Desc: ${dexter.data?.seoDescription ? 'Present' : 'MISSING'}`);
    } else {
        console.log("Not found in backup.");
    }
}

debugEntry();
