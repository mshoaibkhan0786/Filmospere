import fs from 'fs';
import path from 'path';

const MAX_SIZE_BYTES = 45 * 1024 * 1024; // 45MB chunks (safe margin for 50MB-100MB limits)
const INPUT_FILE = path.join(process.cwd(), 'dist', 'movies.json');
const OUTPUT_DIR = path.join(process.cwd(), 'public');

async function splitMovies() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('❌ movies.json not found in public/');
        process.exit(1);
    }

    console.log('📖 Reading movies.json...');
    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    const movies = JSON.parse(rawData);
    console.log(`🎬 Loaded ${movies.length} movies. Calculating splits...`);

    let currentChunk = [];
    let currentSize = 0;
    let fileIndex = 1;

    for (const movie of movies) {
        const movieStr = JSON.stringify(movie);
        const movieSize = Buffer.byteLength(movieStr, 'utf-8');

        // Check if adding this movie exceeds the limit (plus minimal JSON overhead)
        if (currentSize + movieSize > MAX_SIZE_BYTES && currentChunk.length > 0) {
            saveChunk(currentChunk, fileIndex);
            currentChunk = [];
            currentSize = 0;
            fileIndex++;
        }

        currentChunk.push(movie);
        currentSize += movieSize;
    }

    if (currentChunk.length > 0) {
        saveChunk(currentChunk, fileIndex);
    }

    console.log(`✅ Splitting complete! generated ${fileIndex} chunks.`);
}

function saveChunk(data, index) {
    const fileName = `movies_part${index}.json`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log(`💾 Saved ${fileName} (${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB)`);
}

splitMovies();
