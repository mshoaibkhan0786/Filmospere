
const fs = require('fs');
const path = require('path');

const dumpPath = path.join('C:\\WEB DEV\\Filmospere\\Filmospere Repo\\dist\\movies.json');
const aiDataPath = path.join('C:\\WEB DEV\\Filmospere\\AI DATA\\tmdb-5566.json');
const part1 = path.join('C:\\WEB DEV\\Filmospere\\Filmospere Repo\\public\\movies_part1.json');
const part2 = path.join('C:\\WEB DEV\\Filmospere\\Filmospere Repo\\public\\movies_part2.json');
const part3 = path.join('C:\\WEB DEV\\Filmospere\\Filmospere Repo\\public\\movies_part3.json');

// 1. Delete AI Data File
if (fs.existsSync(aiDataPath)) {
    fs.unlinkSync(aiDataPath);
    console.log('Deleted AI DATA/tmdb-5566.json');
} else {
    console.log('AI DATA file not found (already deleted?)');
}

// 2. Remove from Dump
if (fs.existsSync(dumpPath)) {
    let movies = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
    const initialCount = movies.length;
    movies = movies.filter(m => m.id !== 'tmdb-5566');
    if (movies.length < initialCount) {
        console.log(`Removed Rush (tmdb-5566) from dist/movies.json. Count: ${initialCount} -> ${movies.length}`);
        fs.writeFileSync(dumpPath, JSON.stringify(movies, null, 2));
    } else {
        console.log('Rush not found in dist/movies.json');
    }
}

// 3. Remove from Parts (Fallbacks) - Quick Patch 
// (We run split_movies.js usually, but we can patch directly to be safe)
const parts = [part1, part2, part3];
parts.forEach(p => {
    if (fs.existsSync(p)) {
        let items = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const len = items.length;
        items = items.filter(m => m.id !== 'tmdb-5566');
        if (items.length < len) {
            console.log(`Removed Rush from ${path.basename(p)}`);
            fs.writeFileSync(p, JSON.stringify(items));
        }
    }
});

console.log('Local Deletion Complete.');
