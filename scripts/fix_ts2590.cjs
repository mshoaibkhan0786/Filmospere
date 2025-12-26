const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/tmdbMovies.ts');

try {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if already fixed
    if (content.includes('as any;')) {
        console.log('Already fixed.');
        process.exit(0);
    }

    // Replace the export statement
    // It currently looks like: export const tmdbMovies: Movie[] = [...];
    // We want to wrap the array or cast it.
    // Easiest is to append ' as any' before the semicolon.
    // Find the last semicolon
    const lastSemi = content.lastIndexOf(';');
    if (lastSemi > -1) {
        // Check if it's the end of the array assignment
        // The file usually ends with `];\n`
        const beforeSemi = content.substring(lastSemi - 1, lastSemi);
        if (beforeSemi === ']') {
            const newContent = content.substring(0, lastSemi) + ' as any' + content.substring(lastSemi);
            fs.writeFileSync(filePath, newContent);
            console.log('Applied "as any" cast to tmdbMovies.ts');
        } else {
            console.log('Could not safely find the end of the array.');
        }
    } else {
        console.log('No semicolon found?');
    }

} catch (err) {
    console.error('Error:', err);
}
