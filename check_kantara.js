import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moviesPath = path.join(__dirname, 'public', 'movies.json');

try {
    const data = fs.readFileSync(moviesPath, 'utf8');
    const movies = JSON.parse(data);
    const kantara = movies.find(m => m.title.includes('Kantara'));

    if (kantara) {
        console.log('Kantara Data Found:');
        console.log('ID:', kantara.id);
        console.log('Title:', kantara.title);
        console.log('Language:', kantara.language);
        console.log('Original Language:', kantara.originalLanguage); // if exists
    } else {
        console.log('Kantara not found in movies.json');
    }
} catch (err) {
    console.error('Error reading movies.json:', err);
}
