
const fs = require('fs');
const path = require('path');

const dumpPath = path.join('C:\\WEB DEV\\Filmospere\\Filmospere Repo\\dist\\movies.json');
const rushPath = path.join(__dirname, '../../AI DATA/tmdb-5566.json');

const movies = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
const rushData = JSON.parse(fs.readFileSync(rushPath, 'utf-8'));

const index = movies.findIndex(m => m.id === 'tmdb-5566');
if (index !== -1) {
    console.log(`Fixing Rush metadata...`);
    movies[index] = {
        ...movies[index],
        ...rushData,
        // FORCE CORRECT METADATA
        contentType: 'movie',
        releaseYear: 1991,
        releaseDate: '1991-10-04',
        // Clear TV specific fields
        totalSeasons: undefined,
        // Keep existing poster? It might be wrong.
        // User likely needs to refresh it.
        // We will toggle 'isOptimized' to false to force re-check if possible?
        // But for now, let's just save the correct text.
    };
    fs.writeFileSync(dumpPath, JSON.stringify(movies, null, 2));
    console.log('✅ Patched dist/movies.json with Correct Year/Type too.');
}
