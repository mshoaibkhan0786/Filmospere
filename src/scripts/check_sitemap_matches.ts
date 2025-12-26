
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sitemapPath = path.resolve(__dirname, '../../public/sitemap.xml');

const targets = ['Balinsasayaw', 'Kulong', 'Eks', 'Rita', 'Arouse', 'Bayo', 'Ekis', 'Kirot', 'Anor'];

if (fs.existsSync(sitemapPath)) {
    const content = fs.readFileSync(sitemapPath, 'utf-8');
    console.log('Sitemap size:', content.length);

    for (const t of targets) {
        // Simple case insensitive check
        const regex = new RegExp(t, 'i');
        if (regex.test(content)) {
            console.log(`✅ FOUND in sitemap: "${t}"`);
            // Extract usage
            const lines = content.split('\n');
            lines.forEach(line => {
                if (line.match(new RegExp(t, 'i'))) {
                    console.log(`   Line: ${line.trim().substring(0, 100)}...`);
                }
            });
        } else {
            console.log(`❌ Not in sitemap: "${t}"`);
        }
    }
} else {
    console.error('Sitemap not found');
}
