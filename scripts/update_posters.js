
import fs from 'fs';
import path from 'path';

const part2Path = path.join(process.cwd(), 'src/data/wikidataMoviesPart2.ts');
const part1Path = path.join(process.cwd(), 'src/data/wikidataMoviesPart1.ts');

const genrePosters = {
    'Action': 'https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?auto=format&fit=crop&w=500&q=60', // Dark moody
    'Sci-Fi': 'https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?auto=format&fit=crop&w=500&q=60',
    'Adventure': 'https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?auto=format&fit=crop&w=500&q=60',
    'Comedy': 'https://images.unsplash.com/photo-1517604931442-7105364bacca?auto=format&fit=crop&w=500&q=60', // Popcorn/Bright
    'Family': 'https://images.unsplash.com/photo-1517604931442-7105364bacca?auto=format&fit=crop&w=500&q=60',
    'Horror': 'https://images.unsplash.com/photo-1505635552518-3448ff116af3?auto=format&fit=crop&w=500&q=60', // Dark forest
    'Thriller': 'https://images.unsplash.com/photo-1505635552518-3448ff116af3?auto=format&fit=crop&w=500&q=60',
    'Drama': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=60', // Projector
    'Romance': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=60',
    'Default': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=60' // Cinema Hall
};

function getPosterForTags(tags) {
    if (!tags || !Array.isArray(tags)) return genrePosters['Default'];

    for (const tag of tags) {
        if (genrePosters[tag]) {
            return genrePosters[tag];
        }
    }
    return genrePosters['Default'];
}

function processFile(filePath, varName) {
    console.log(`Processing ${filePath}...`);
    try {
        let content = fs.readFileSync(filePath, 'utf-8');

        // Extract array content using regex to be safe with file structure
        const arrayStart = content.indexOf('[');
        const arrayEnd = content.lastIndexOf(']');

        if (arrayStart === -1 || arrayEnd === -1) {
            console.error(`Could not find array in ${filePath}`);
            return;
        }

        const arrayContent = content.substring(arrayStart, arrayEnd + 1);

        // Use Function to safely evaluate the object literal array (JSON.parse might fail on loose trailing commas or single quotes if present)
        // Since the file uses strictly quoted JSON keys based on previous view, JSON.parse might work if we fix trailing commas.
        // But `eval` or `new Function` is safer for JS object literals.
        // NOTE: This is a dev script run by me, so it's relatively safe.
        // However, the file is huge. Eval might stack overflow.
        // Let's try JSON.parse first, assuming stricter format seen in view_file.
        // The view_file showed: "id": "Q...", keys are quoted.

        // Let's rely on regex replacement line-by-line for memory efficiency and safety against parse errors?
        // No, we need context (tags) to choose the right poster.
        // So we must parse.

        // To avoid big eval, let's use a regex to capture each object block?
        // Objects are wrapped in { }.

        let validJson = arrayContent;
        // Fix trailing commas usually found in TS arrays
        validJson = validJson.replace(/,\s*]/g, ']');

        let movies;
        try {
            movies = JSON.parse(validJson);
        } catch (e) {
            console.log("Direct JSON parse failed (likely loose JS format). Using eval approach.");
            // Strip any imports or types if they leaked in (though we substringed).
            movies = eval(arrayContent);
        }

        let updatedCount = 0;
        const updatedMovies = movies.map(movie => {
            if (!movie.posterUrl || movie.posterUrl === "" || movie.posterUrl === "null") {
                movie.posterUrl = getPosterForTags(movie.tags);
                // Also ensure images array has it if empty
                if (!movie.images || movie.images.length === 0) {
                    movie.images = [movie.posterUrl];
                }
                updatedCount++;
            }
            return movie;
        });

        console.log(`Updated ${updatedCount} movies in ${path.basename(filePath)}`);

        const newContent = `
export const ${varName}: any[] = ${JSON.stringify(updatedMovies, null, 4)};
`;

        fs.writeFileSync(filePath, newContent);
        console.log(`Saved ${path.basename(filePath)}`);

    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
    }
}

// Process Part 2 (where we saw the nulls)
processFile(part2Path, 'wikidataMoviesPart2');

// Process Part 1 just in case
processFile(part1Path, 'wikidataMoviesPart1');
