const fs = require('fs');
const path = require('path');

const manualMoviesPath = path.join(__dirname, '../src/data/manualMovies.ts');

try {
    let content = fs.readFileSync(manualMoviesPath, 'utf8');

    // This regex finds the cast array content. 
    // It looks for "cast": [ ... ] and tries to iterate over objects inside.
    // However, parsing TS file as JSON is hard. 
    // Instead, we will use a regex replace on the specific "id": "..." line inside cast objects?
    // Or better, we define a replacer function for the whole file?

    // Strategy: Look for blocks that resemble cast members and replace their IDs.
    // Cast member structure:
    // {
    //     "id": "...",
    //     "name": "...",
    //     ...
    // }

    // We will find all occurrences of "id": "..." followed by "name": "..." in the same object block roughly.
    // Actually, simply finding "name": "Some Name" and replacing the PRECEDING "id": "..." might be safer if they are close.
    // But JSON/JS object structure in strings is tricky.

    // Let's use a more robust regex to find the cast member object block.
    // Assuming standard formatting as seen in file views:
    // {
    //     "id": "cast-...",
    //     "name": "Name",

    // Regex to match: "id":\s*".*?",\s*"name":\s*"(.*?)"

    // 1. Standardize Cast IDs
    let newContent = content.replace(/"id":\s*"[^"]*",\s*"name":\s*"(.*?)"/g, (match, name) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newId = `actor-${slug}`;
        // console.log(`Rewriting ID for ${name} -> ${newId}`); // Commented out to reduce noise
        return `"id": "${newId}",\n                "name": "${name}"`;
    });

    // 2. Reset View Counts to 0
    newContent = newContent.replace(/"views":\s*\d+/g, (match) => {
        return `"views": 0`;
    });
    console.log('Reset all view counts to 0.');

    // Also handle cases where "name" comes first? (Unlikely based on previous views, but good to be safe?)
    // The previous view showed ID first. We will stick to that pattern as seen in lines 40-50 of manualMovies.ts

    fs.writeFileSync(manualMoviesPath, newContent, 'utf8');
    console.log('Successfully standardized cast IDs in manualMovies.ts');

} catch (err) {
    console.error('Error processing file:', err);
    process.exit(1);
}
