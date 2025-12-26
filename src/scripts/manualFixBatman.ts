
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the file as text to preserve structure if possible, but actually we will just overwrite it formatted.
// Importing it to get the data is safest.
import { manualMovies } from '../data/manualMovies.ts';

const targetId = 'tmdb-2022';
const targetMovie = manualMovies.find(m => m.id === targetId);

if (targetMovie) {
    console.log('Found The Batman. Updating streaming links...');
    targetMovie.streamingLinks = [
        {
            platform: "Netflix",
            url: "https://www.netflix.com/title/81059720"
        },
        {
            platform: "Amazon Prime Video",
            url: ""
        }
    ];
} else {
    console.error('The Batman (tmdb-2022) not found in manualMovies.ts! This is unexpected.');
    process.exit(1);
}

// Construct the new file content
const newContent = `import type { Movie } from '../types';

export const manualMovies: Movie[] = ${JSON.stringify(manualMovies, null, 4)};
`;

const manualMoviesPath = path.join(__dirname, '../data/manualMovies.ts');
fs.writeFileSync(manualMoviesPath, newContent, 'utf-8');

console.log('Successfully updated manualMovies.ts with Batman streaming links.');
