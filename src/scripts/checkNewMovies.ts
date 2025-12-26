
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmdbPath = path.join(__dirname, '../data/tmdbMovies.json');
const raw = fs.readFileSync(tmdbPath, 'utf-8');
const movies = JSON.parse(raw);

const lastMovies = movies.slice(-20);
console.log('--- Last 20 Fetched Movies ---');
lastMovies.forEach(m => console.log(`- ${m.title} (${m.releaseYear})`));
