import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE = path.resolve(__dirname, '../src/data/tmdbMovies.json');

async function main() {
    const data = await fs.readFile(FILE, 'utf-8');
    const movies = JSON.parse(data);
    const last5 = movies.slice(-5);
    console.log(JSON.stringify(last5, ['title', 'tags', 'language'], 2));
}

main();
