import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/data/wikidataMoviesPart1.ts');
const placeholderUrl = "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=600&q=80"; // Copyright free placeholder

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Replace empty strings "" with placeholder
    content = content.replace(/"posterUrl":\s*""/g, `"posterUrl": "${placeholderUrl}"`);

    // 2. Replace "N/A" with placeholder
    content = content.replace(/"posterUrl":\s*"N\/A"/g, `"posterUrl": "${placeholderUrl}"`);

    fs.writeFileSync(filePath, content);
    console.log('Fixed thumbnails in wikidataMoviesPart1.ts');

} catch (err) {
    console.error('Error fixing thumbnails:', err);
}
