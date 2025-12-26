const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../src/data/tmdbMovies.ts');

try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');

    console.log(`First Bracket: ${firstBracket}, Last Bracket: ${lastBracket}`);

    if (firstBracket === -1 || lastBracket === -1) {
        throw new Error('Brackets not found');
    }

    const jsonStr = content.substring(firstBracket, lastBracket + 1);
    console.log('--- START OF JSON STRING ---');
    console.log(jsonStr.substring(0, 100));
    console.log('--- END OF JSON STRING ---');
    console.log(jsonStr.substring(jsonStr.length - 100));

} catch (err) {
    console.error(err);
}
