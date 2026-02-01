
const fs = require('fs');
const path = require('path');

const dumpPath = path.join('C:\\WEB DEV\\Filmospere\\Filmospere Repo\\dist\\movies.json'); // Adjusted to absolute path or relative

if (!fs.existsSync(dumpPath)) {
    console.error('Movies dump not found.');
    process.exit(1);
}

const movies = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
const rush = movies.find(m => m.id === 'tmdb-5566');

if (rush) {
    console.log(JSON.stringify(rush, null, 2));
} else {
    console.error('Rush not found in dump.');
}
