const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'data', 'wikidataMoviesPart1.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Function to convert Special:FilePath URLs to direct URLs
function convertWikimediaUrl(url) {
    if (url.includes('/wiki/Special:FilePath/')) {
        // Extract the filename from the Special:FilePath URL
        const match = url.match(/Special:FilePath\/(.+)$/);
        if (match) {
            const filename = decodeURIComponent(match[1]);
            // Convert to direct commons URL
            return `https://upload.wikimedia.org/wikipedia/commons/thumb/${filename}`;
        }
    }
    return url;
}

// Pattern 1: Fix http://www.wikidata.org/.well-known/genid/ URLs
// Pattern 2: Fix http://commons.wikimedia.org/wiki/Special:FilePath/ URLs

// Convert Special:FilePath URLs to direct URLs
content = content.replace(
    /http:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/([^\s"]+)/g,
    (match, filename) => {
        const decodedFilename = decodeURIComponent(filename);
        // For Monsters University and similar - use direct wikipedia/en URLs when available
        if (decodedFilename.includes('Monsters University')) {
            return 'https://upload.wikimedia.org/wikipedia/en/2/2a/Monsters_University_poster.jpg';
        }
        // Otherwise, convert to commons URL format
        return `https://upload.wikimedia.org/wikipedia/commons/${decodedFilename}`;
    }
);

// Write the changes back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed Special:FilePath URLs in wikidataMoviesPart1.ts');

// Now do the same for wikidataMoviesPart2.ts
const filePath2 = path.join(__dirname, 'src', 'data', 'wikidataMoviesPart2.ts');
if (fs.existsSync(filePath2)) {
    let content2 = fs.readFileSync(filePath2, 'utf8');

    content2 = content2.replace(
        /http:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/([^\s"]+)/g,
        (match, filename) => {
            const decodedFilename = decodeURIComponent(filename);
            return `https://upload.wikimedia.org/wikipedia/commons/${decodedFilename}`;
        }
    );

    fs.writeFileSync(filePath2, content2, 'utf8');
    console.log('Fixed Special:FilePath URLs in wikidataMoviesPart2.ts');
}
