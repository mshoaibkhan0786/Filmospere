const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/manualMovies.ts');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Extract the JSON part
    // Assuming format: export const manualMovies: Movie[] = [ ... ];
    const startMarker = 'export const manualMovies: Movie[] = ';
    const startIndex = content.indexOf(startMarker);

    if (startIndex === -1) {
        console.error('Could not find start marker');
        process.exit(1);
    }

    const arrayStart = startIndex + startMarker.length;
    // Find the last semicolon
    const lastSemi = content.lastIndexOf(';');

    const jsonStr = content.substring(arrayStart, lastSemi);

    // Evaluate or parse? It looks like valid JSON in the previous view_file, but properties are quoted.
    // However, it might be safer to strictly parse if it's pure JSON. 
    // Let's assume it is valid JSON because it was likely generated that way.
    let movies;
    try {
        movies = JSON.parse(jsonStr);
    } catch (e) {
        // If JSON.parse fails (maybe trailing commas?), fallback to eval (unsafe but effective for local scripts)
        // or just regex replace. 
        console.log('Direct JSON parse failed, attempting loose parse...');
        // Actually, if it's TS file, it might just be valid JS object literals.
        // Let's use string manipulation if parsing is hard, OR just filter the array in memory if I can require it?
        // But it imports types, so I can't require it in Node directly without ts-node.

        // Let's try to regex filter the raw string if strict parsing fails?
        // No, that's risky.
        // The file content from view_file Step 105 look like standard JSON with double quotes.
        throw e;
    }

    const initialCount = movies.length;
    const filteredMovies = movies.filter(m => !m.id.startsWith('omdb-'));
    const finalCount = filteredMovies.length;

    console.log(`Removed ${initialCount - finalCount} OMDB movies.`);

    const newContent = `${content.substring(0, arrayStart)}${JSON.stringify(filteredMovies, null, 4)};\n`;

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully updated manualMovies.ts');

} catch (err) {
    console.error('Error processing file:', err);
    process.exit(1);
}
