const fs = require('fs');
const path = require('path');

const MATURE_KEYWORDS = [
    'erotic', 'sex', 'nude', 'naked', 'adult', 'XXX', 'porn', 'sensual',
    'affair', 'cheating', 'lust', 'passion', 'desire', 'hot night', 'sange',
    'ganteng', 'uncut', '18+', 'mature', 'forbidden'
];

const IGNORE_TITLES = [
    'Sex and the City', 'Sex Education', 'Uncut Gems' // Common false positives
];

async function scan() {
    console.log('Scanning for mature content...');
    const results = [];

    // Scan all parts
    for (let i = 1; i <= 3; i++) {
        const filePath = path.join('public', `movies_part${i}.json`);
        if (fs.existsSync(filePath)) {
            console.log(`Reading ${filePath}...`);
            const raw = fs.readFileSync(filePath, 'utf-8');
            const movies = JSON.parse(raw);

            movies.forEach(m => {
                const textToCheck = `${m.title} ${m.slug} ${m.description || ''} ${(m.tags || []).join(' ')}`.toLowerCase();

                // Check for matches
                const matchedKeyword = MATURE_KEYWORDS.find(k => textToCheck.includes(k.toLowerCase()));

                if (matchedKeyword) {
                    // Filter false positives
                    if (IGNORE_TITLES.some(ignored => m.title.includes(ignored))) return;

                    // Push candidate
                    results.push({
                        title: m.title,
                        slug: m.slug,
                        id: m.id,
                        reason: matchedKeyword
                    });
                }
            });
        }
    }

    console.log(`\nFound ${results.length} potential candidates.`);
    console.log(JSON.stringify(results.slice(0, 50), null, 2));
}

scan();
