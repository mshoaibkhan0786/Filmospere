const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, '../pinterest_bulk_upload.csv');

function removeDuplicates() {
    let content = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = content.split('\n');
    const header = lines[0];

    // Titles to remove
    const targets = [
        "The Martian",
        "Gone Girl",
        "Money Heist", // Keeping based on previous context, but will rely on screenshot mainly
        "Zootopia",
        "Whiplash",
        "Jigarthanda",
        "Vaastav",
        "Ziggy Stardust",
        "Gloomy Sunday",
        "The Revenant",
        "The Nice Guys",
        "GGS",
        "Ligaw"
    ];

    const filteredLines = [header];
    let removedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        let isDuplicate = false;
        // Check if line contains any of the target titles
        // We match strictly on the Title field (the first part of the CSV line)
        // or just looser substring check since these titles are specific enough?
        // Let's be safer: get the title field.

        // Line format: Title,Description,Link...
        // Titles might be quoted or not.
        // e.g. Survival on Mars: Why 'The Martian' Should Be on Your Watchlist
        // e.g. Discover the Thrills of 'Gone Girl': A Must-Watch Cinematic Puzzle!

        // The titles in the CSV are AI generated and might contain the movie name inside a longer string.
        // e.g. "Survival on Mars: Why 'The Martian' Should Be on Your Watchlist"

        // So checking if the line *contains* the movie title is actually the right heuristic here,
        // given the distinct names.

        for (const t of targets) {
            // Check if the movie title appears in the first segment of the line (the generated title) or description?
            // Actually, `generate_pinterest_csv.js` puts the *generated* title in the first column.
            // But the generated title usually contains the Movie Title.
            // Let's check the movie title in the line.

            if (line.includes(t)) {
                isDuplicate = true;
                break;
            }
        }

        if (!isDuplicate) {
            filteredLines.push(line);
        } else {
            console.log(`Removing duplicate: ${line.substring(0, 50)}...`);
            removedCount++;
        }
    }

    fs.writeFileSync(CSV_FILE, filteredLines.join('\n'));
    console.log(`Removed ${removedCount} duplicate entries.`);
}

removeDuplicates();
