
const fs = require('fs');
const path = require('path');

const AI_DATA_DIR = 'C:\\WEB DEV\\Filmospere\\AI DATA';
const OUTPUT_FILE = 'invalid_entries_report.json';

const suspiciousKeywords = [
    { word: 'TV Series', reason: 'Likely TV Show' },
    { word: 'Season 1', reason: 'Likely TV Show' },
    { word: 'Season 2', reason: 'Likely TV Show' },
    { word: 'Episodes', reason: 'Likely TV Show' },
    { word: 'Reality Show', reason: 'Likely Reality TV' },
    { word: 'Miniseries', reason: 'Likely Miniseries' },
    { word: 'Television', reason: 'Mention of Television' },
    { word: 'Animated Series', reason: 'Likely Animated Series' }
];

// Exemptions (Movies that might contain these words legitimately)
// e.g., "Holiday Season"
const exemptions = ['Holiday Season', 'Award Season'];

function scanFiles() {
    console.log(`Scanning ${AI_DATA_DIR}...`);
    const files = fs.readdirSync(AI_DATA_DIR).filter(f => f.endsWith('.json'));
    const suspects = [];

    let count = 0;
    for (const file of files) {
        const content = fs.readFileSync(path.join(AI_DATA_DIR, file), 'utf-8');
        try {
            const data = JSON.parse(content);
            const textToCheck = (data.description + ' ' + (data.keywords || '')).toLowerCase();

            for (const kw of suspiciousKeywords) {
                if (textToCheck.includes(kw.word.toLowerCase())) {
                    // Check exemptions
                    let isExempt = false;
                    for (const ex of exemptions) {
                        if (textToCheck.includes(ex.toLowerCase())) {
                            isExempt = true;
                            break;
                        }
                    }

                    if (!isExempt) {
                        suspects.push({
                            file: file,
                            id: data.id,
                            title: data.title,
                            reason: kw.reason,
                            match: kw.word,
                            excerpt: data.description.substring(0, 100) + '...'
                        });
                        break; // Found one reason, move to next file
                    }
                }
            }
        } catch (err) {
            console.error(`Error parsing ${file}:`, err);
        }
        count++;
        if (count % 1000 === 0) process.stdout.write('.');
    }
    console.log('\nScan complete.');

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(suspects, null, 2));
    console.log(`Found ${suspects.length} suspicious entries. Saved to ${OUTPUT_FILE}`);
}

scanFiles();
