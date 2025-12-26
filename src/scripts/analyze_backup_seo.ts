
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupPath = path.resolve(__dirname, '../../movies_backup.json');

function analyzeBackup() {
    console.log(`Analyzing SEO coverage in: ${backupPath}`);

    if (!fs.existsSync(backupPath)) {
        console.log("Backup file NOT found.");
        return;
    }

    const raw = fs.readFileSync(backupPath, 'utf-8');
    const data = JSON.parse(raw);
    const movies = Array.isArray(data) ? data : (data.movies || []);

    console.log(`Total Movies in Backup: ${movies.length}`);

    let hasSEO = 0;
    let missingSEO = 0;

    // Check Jawan and Green Book specifically for debugging
    let jawanStatus = 'Not Found';
    let gbStatus = 'Not Found';

    movies.forEach((m: any) => {
        const seo = m.data?.seoDescription || m.seoDescription;
        const matchesRequest = (seo && seo.length > 10);

        if (matchesRequest) {
            hasSEO++;
        } else {
            missingSEO++;
        }

        const title = (m.title || '').trim().toLowerCase();
        if (title === 'jawan') {
            jawanStatus = matchesRequest ? 'Present ✅' : 'Missing ❌';
        }
        if (title === 'green book') {
            gbStatus = matchesRequest ? 'Present ✅' : 'Missing ❌';
        }
    });

    console.log(`\n--- RESULTS ---`);
    console.log(`Movies WITH SEO Description: ${hasSEO}`);
    console.log(`Movies WITHOUT SEO Description: ${missingSEO}`);
    console.log(`Percentage Missing: ${((missingSEO / movies.length) * 100).toFixed(1)}%`);

    console.log(`\n--- SPOT CHECKS ---`);
    console.log(`Jawan: ${jawanStatus}`);
    console.log(`Green Book: ${gbStatus}`);
}

analyzeBackup();
