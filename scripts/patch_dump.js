
const fs = require('fs');
const path = require('path');

const dumpPath = path.join(__dirname, '../dist/movies.json');
const rushPath = path.join(__dirname, '../../AI DATA/tmdb-5566.json');

if (!fs.existsSync(dumpPath) || !fs.existsSync(rushPath)) {
    console.error('File missing');
    process.exit(1);
}

const movies = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
const rushData = JSON.parse(fs.readFileSync(rushPath, 'utf-8'));

const index = movies.findIndex(m => m.id === 'tmdb-5566');
if (index !== -1) {
    console.log(`Found Rush at index ${index}. Updating...`);
    // Preserve existing fields not in AI data if any, but Rush AI data is comprehensive
    movies[index] = {
        ...movies[index],
        ...rushData,
        // Ensure critical fields
        posterUrl: movies[index].posterUrl || rushData.posterUrl,
    };
    fs.writeFileSync(dumpPath, JSON.stringify(movies, null, 2));
    console.log('✅ Patched dist/movies.json with correct Rush data.');
} else {
    console.error('❌ Rush (tmdb-5566) not found in dump.');
}
