const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../src/data/tmdbMovies.ts');
const outputPath = path.join(__dirname, '../src/data/tmdbMovies.json');

try {
    const content = fs.readFileSync(inputPath, 'utf-8');

    // Find array start
    const exportDef = 'export const tmdbMovies';
    const defIndex = content.indexOf(exportDef);
    if (defIndex === -1) throw new Error('Could not find export definition');

    const firstBracket = content.indexOf('[', defIndex + exportDef.length);
    const lastBracket = content.lastIndexOf(']');

    if (firstBracket === -1 || lastBracket === -1) {
        throw new Error('Brackets not found');
    }

    const jsonStr = content.substring(firstBracket, lastBracket + 1);

    // Use eval to parse the JS array literal
    const data = eval(jsonStr);

    console.log(`Successfully parsed ${data.length} movies.`);

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 4));
    console.log(`Saved to ${outputPath}`);

} catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
}
