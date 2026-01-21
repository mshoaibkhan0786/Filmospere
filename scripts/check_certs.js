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

async function checkCertifications() {
    console.log('Checking certifications for manual list...');

    for (let i = 1; i <= 3; i++) {
        const filePath = path.join('public', `movies_part${i}.json`);
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const movies = JSON.parse(raw);

            movies.forEach(m => {
                if (MANUAL_SLUGS.includes(m.slug)) {
                    console.log(`\nFound: ${m.title}`);
                    console.log(`Slug: ${m.slug}`);
                    console.log(`Certification: ${m.certification || 'MISSING/NULL'}`);
                }
            });
        }
    }
}

checkCertifications();
