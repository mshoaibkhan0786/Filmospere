
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmdbDataPath = path.join(__dirname, '../data/tmdbMovies.json');

async function run() {
    console.log('Manually patching SRK Devdas (tmdb-15917) due to API Rate Limit...');
    const raw = fs.readFileSync(tmdbDataPath, 'utf-8');
    let movies = JSON.parse(raw);

    const idx = movies.findIndex(m => m.id === 'tmdb-15917');
    if (idx === -1) {
        console.error('Movie not found!');
        return;
    }
    
    // Manual High Quality Data
    movies[idx].seoDescription = "Forbidden from marrying his childhood sweetheart Paro, a wealthy law graduate descends into a tragic spiral of alcoholism and self-destruction, finding solace in the arms of a courtesan.";
    movies[idx].whyWatch = [
        "🎭 Shah Rukh Khan delivers a heartbreaking, iconic performance.",
        "💃 Breathtaking dance sequences featuring Aishwarya Rai and Madhuri Dixit.",
        "🎬 Experience Sanjay Leela Bhansali's opulent and visually stunning direction."
    ];
    movies[idx].language = "Hindi";

    fs.writeFileSync(tmdbDataPath, JSON.stringify(movies, null, 2));
    console.log('Successfully patched Devdas (2002)!');
}

run();
