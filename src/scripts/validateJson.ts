
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, '../../public/movies.json');
const tmdbPath = path.join(__dirname, '../data/tmdbMovies.json');

function checkFile(filePath: string, name: string) {
    console.log(`Checking ${name}...`);
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ ${name} does not exist.`);
            return;
        }
        const Stats = fs.statSync(filePath);
        console.log(`Size: ${(Stats.size / 1024 / 1024).toFixed(2)} MB`);

        const content = fs.readFileSync(filePath, 'utf-8');
        JSON.parse(content);
        console.log(`✅ ${name} is VALID JSON.`);
    } catch (e: any) {
        console.error(`❌ ${name} is INVALID: ${e.message}`);
    }
}

checkFile(tmdbPath, 'tmdbMovies.json');
checkFile(publicPath, 'public/movies.json');
