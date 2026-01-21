const fs = require('fs');
const path = require('path');

const MANUAL_SLUGS = [
    'ggs-ganteng-ganteng-sange-2023',
    'when-a-hot-night-opens-2-2021',
    'what-fun-we-were-having-4-stories-about-date-rape-2011',
    'ang-daigdig-ay-isang-butil-na-luha-1986',
    'the-illusioned-ones-2025',
    'ligaw-2025',
    'the-shameful-secret-of-a-good-boy-1976',
    'last-exit-to-brooklyn-1989',
    'gloomy-sunday-1999'
];

const MATURE_CERTS = ['NC-17', '18+', 'R21', 'R18'];

async function countMature() {
    console.log('Counting Mature Content...');
    let manualCount = 0;
    let autoCount = 0;
    const uniqueIDs = new Set();

    // Scan all parts
    for (let i = 1; i <= 3; i++) {
        const filePath = path.join('public', `movies_part${i}.json`);
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const movies = JSON.parse(raw);

            movies.forEach(m => {
                const isManual = MANUAL_SLUGS.includes(m.slug);
                const isAuto = m.certification && MATURE_CERTS.some(c => m.certification.toUpperCase().includes(c));

                if (isManual || isAuto) {
                    uniqueIDs.add(m.id);
                    if (isManual) manualCount++;
                    if (isAuto && !isManual) autoCount++; // Only count strictly auto ones here for clarity

                    if (isAuto) {
                        // console.log(`[Auto-Tagged] ${m.title} (${m.certification})`);
                    }
                }
            });
        }
    }

    console.log(`\n--- Results ---`);
    console.log(`Manual List Items Found: ${manualCount} / ${MANUAL_SLUGS.length}`);
    console.log(`Auto-Detected (via Cert): ${autoCount}`);
    console.log(`---------------------`);
    console.log(`TOTAL MATURE MOVIES: ${uniqueIDs.size}`);
}

countMature();
