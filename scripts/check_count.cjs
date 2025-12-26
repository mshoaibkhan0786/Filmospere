const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/omdbMovies.ts');
try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/export const omdbMovies: Movie\[] = (\[[\s\S]*\]);/);
    if (match && match[1]) {
        // Simple and dirty way to parse if it's valid JSON-ish
        // It might not be strict JSON if keys aren't quoted or trailing commas exist
        // But the previous scripts wrote it with JSON.stringify, so it SHOULD be valid JSON.
        const movies = JSON.parse(match[1]);
        console.log(`Current movie count: ${movies.length}`);
    } else {
        console.log('Could not find movie array in file.');
    }
} catch (e) {
    console.error('Error:', e.message);
}
