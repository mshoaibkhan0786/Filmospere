const fs = require('fs');
const path = require('path');

// Helper to read TS file as if it were data
// Since we can't directly require the TS file, we'll read it and parse the JSON-like structure
// Or better, since the file exports a const, we can try to extract the array content using regex or string manipulation
// But that's risky.
// Better approach: Since we are in the same repo, we can maybe modify the file to be a temporary JS file or just regex the matches.
// Actually, `src/data/omdbMovies.ts` is just `export const omdbMovies: Movie[] = [...];`
// So if we read the file content, remove the TS type and export, we can eval it or JSON.parse it? No, it has keys without quotes? 
// No, the previous view_file showed it has standard JSON formatting for keys and strings, just inside a TS variable.
// Let's assume it's valid JSON structure inside the array brackets.

try {
    const filePath = path.join(__dirname, '../src/data/omdbMovies.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract the array part. 
    // It starts after `export const omdbMovies: Movie[] = `
    const startIndex = content.indexOf('[');
    const endIndex = content.lastIndexOf(']');

    if (startIndex === -1 || endIndex === -1) {
        console.error('Could not find array in file');
        process.exit(1);
    }

    const arrayString = content.substring(startIndex, endIndex + 1);

    // The content inside the array seems to be valid JSON (keys in quotes). 
    // Let's try to parse it. If keys are not quoted, we might need a looser parser.
    // Looking at the view_file output: "id": "omdb-tt4695284", ... keys ARE quoted.
    // BUT, trailing commas might exist which JSON.parse hates.
    // And comments // if any.

    // Let's try eval() in a safe-ish way? It's a localized script.
    const movies = eval(arrayString);

    const series = movies.filter(m => m.contentType === 'series');
    console.log(`Found ${series.length} series in total.`);

    const incompleteSeries = series.filter(s => {
        // Condition for incomplete:
        // 1. No seasons array
        // 2. Seasons array empty but totalSeasons > 0
        // 3. Seasons exist but episodes are missing/empty

        if (!s.seasons || s.seasons.length === 0) return true;

        // Check if any season has 0 episodes
        const hasEmptySeason = s.seasons.some(season => !season.episodes || season.episodes.length === 0);
        if (hasEmptySeason) return true;

        return false;
    });

    console.log(`Found ${incompleteSeries.length} series with missing/incomplete episode details:`);
    incompleteSeries.forEach(s => {
        console.log(`- ${s.title} (ID: ${s.id}, Seasons: ${s.seasons ? s.seasons.length : 0})`);
    });

} catch (e) {
    console.error('Error processing file:', e);
}
