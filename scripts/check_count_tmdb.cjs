const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/data/tmdbMovies.ts');

if (fs.existsSync(targetPath)) {
    const content = fs.readFileSync(targetPath, 'utf-8');
    const match = content.match(/export const tmdbMovies: Movie\[] = (\[[\s\S]*\]);/);
    if (match && match[1]) {
        try {
            const movies = JSON.parse(match[1].replace(/,(\s*])/g, '$1'));
            console.log(`Current TMDB movie count: ${movies.length}`);
        } catch (e) {
            console.error('Error parsing file:', e.message);
        }
    } else {
        console.error('Could not find movie array in file.');
    }
} else {
    console.error('File not found.');
}
