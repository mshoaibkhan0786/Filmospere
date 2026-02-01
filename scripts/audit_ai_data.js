
const fs = require('fs');
const path = require('path');

const AI_DATA_DIR = 'C:\\WEB DEV\\Filmospere\\AI DATA';

async function audit() {
    console.log('🚀 Auditing AI Data for discrepancies...');

    if (!fs.existsSync(AI_DATA_DIR)) {
        console.error('Directory not found');
        return;
    }

    const files = fs.readdirSync(AI_DATA_DIR).filter(f => f.endsWith('.json') && f.startsWith('tmdb-'));
    console.log(`Found ${files.length} files.`);

    const titleMap = {};
    const suspiciousFiles = [];

    for (const file of files) {
        const content = fs.readFileSync(path.join(AI_DATA_DIR, file), 'utf8');
        try {
            const data = JSON.parse(content);
            const title = data.title;
            const id = data.tmdb_id;
            const desc = data.description || '';
            const keywords = data.keywords || '';

            // 1. Check for Duplicate Titles (Risk of collision)
            if (!titleMap[title]) {
                titleMap[title] = [];
            }
            titleMap[title].push({ id, file, desc });

            // 2. Keyword Heuristics (Finding "Avatar 1941" style mixups)
            // If it's a Hollywood blockbuster ID but has regional keywords? 
            // Hard to know ID metadata without DB.
            // But we can check for logic gaps.

            // Heuristic: "Description mismatch"
            // Does the description mention a year that is vastly different? 
            // (Hard to do without release date in JSON, but we can look for specific keywords)

            const lowerDesc = desc.toLowerCase();
            const lowerKeys = keywords.toLowerCase();

            // Example: "Avatar" 2009 file had "Bengali" or "Indranath" in it.
            // Let's flag files that have "Bengali", "Tamil", "Telugu", "Hindi" 
            // BUT might be famous English movies? 
            // We can't know for sure which are English without a list.

            // Let's just output the Duplicates first as they are the highest risk.

        } catch (e) {
            console.error(`Error parsing ${file}`);
        }
    }

    console.log('\n--- 🚨 Potential Title Collisions (Same Title, Different IDs) ---');
    let duplicateCount = 0;
    for (const title in titleMap) {
        if (titleMap[title].length > 1) {
            console.log(`\nMovie: "${title}"`);
            titleMap[title].forEach(item => {
                console.log(`  - File: ${item.file} | ID: ${item.id}`);
                console.log(`    Excerpt: ${item.desc.substring(0, 100)}...`);
            });
            duplicateCount++;
        }
    }

    if (duplicateCount === 0) {
        console.log('No direct title collisions found.');
    } else {
        console.log(`\nFound ${duplicateCount} titles with multiple entries.`);
    }

    // Heuristic 2: Check for "Avatar" specific keywords in other files just in case
    console.log('\n--- 🔍 Checking for known pollution keywords ---');
    // Patterns that appeared in the bad Avatar file
    const badPatterns = ['Indranath', 'Guru Omkarananda', 'Kamala', 'Premankur Atorthy'];

    for (const file of files) {
        const content = fs.readFileSync(path.join(AI_DATA_DIR, file), 'utf8');
        for (const pattern of badPatterns) {
            if (content.includes(pattern)) {
                // Ignore the actual 1941 movie file
                if (!file.includes('tmdb-421403')) {
                    console.log(`⚠️  Suspicious Pattern "${pattern}" found in ${file}`);
                }
            }
        }
    }

}

audit();
