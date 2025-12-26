
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/data/tmdbMovies.json');
const raw = fs.readFileSync(filePath, 'utf-8');
const movies = JSON.parse(raw);
const last50 = movies.slice(-50);

console.log('--- Last 50 Movies Added ---');
last50.forEach((m: any, i: number) => {
    console.log(`${i + 1}. ${m.title} (${m.releaseYear})`);
});
