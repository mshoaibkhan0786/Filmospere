
const fs = require('fs');
const path = require('path');

const REPORT_FILE = 'invalid_entries_report.json';
const AI_DATA_DIR = 'C:\\WEB DEV\\Filmospere\\AI DATA';

function reAudit() {
    console.log('Re-auditing potentially valid TV shows...');

    if (!fs.existsSync(REPORT_FILE)) {
        console.error('Report file not found.');
        return;
    }

    const suspects = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8'));
    const trueErrors = [];
    const validShows = [];

    // Known Mismatches found manually (to verify script catches them if present)
    // Rush (tmdb-5566) was one.

    // Logic: 
    // If Title is "Breaking Bad" and Description is "Breaking Bad", it is VALID.
    // Error is when Title is "Avatar" but Description is "Indian Movie".

    // We can't easily fetch TMDB API to verify ID->Title mapping offline.
    // But we know 'suspects' list was based on keywords.

    // Let's filter out obviously Correct entries.
    // e.g. "Breaking Bad" file (tmdb-1396) has title "Breaking Bad" and desc "Walter White". -> VALID.

    suspects.forEach(item => {
        const title = item.title.toLowerCase();
        const excerpt = item.excerpt.toLowerCase();

        // Heuristic: Does the description mention the title or key characters?
        // If yes, it's likely CORRECT (just a TV show).
        // If no, and description seems to describe something else, it's suspicious.

        let looksCorrect = false;
        if (excerpt.includes(title)) looksCorrect = true;

        // Manual whitelist of known TV shows from previous analysis
        const knownShows = ['breaking bad', 'game of thrones', 'lost', 'the wire', 'mad men', 'friends', 'office', 'simpsons', 'family guy'];
        if (knownShows.some(s => title.includes(s))) looksCorrect = true;

        if (looksCorrect) {
            validShows.push(item.title);
        } else {
            // Potential mismatch? Or just generic description?
            trueErrors.push(item);
        }
    });

    console.log(`\nFound ${validShows.length} likely VALID TV Shows (Breaking Bad, etc.). Keeping them.`);
    console.log(`Found ${trueErrors.length} requiring manual review (Description didn't blatantly match Title).`);

    // Dump the filtered "Review Needed" list
    console.log('\n--- Potential Mismatches (Requires Human Eye) ---');
    trueErrors.forEach(e => {
        console.log(`[${e.id}] Title: "${e.title}" | Reason: ${e.reason}`);
        console.log(`   Excerpt: ${e.excerpt}`);
        console.log('---------------------------------------------------');
    });
}

reAudit();
