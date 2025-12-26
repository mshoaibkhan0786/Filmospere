import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE = path.resolve(__dirname, '../src/data/tmdbMovies.json');

async function main() {
    const data = await fs.readFile(FILE, 'utf-8');
    const movies = JSON.parse(data);
    const last50 = movies.slice(-50).map(m => m.title);
    console.log('Total Movies:', movies.length);
    console.log('Last 50 Added:');
    console.log(last50.join(', '));
}
main();
