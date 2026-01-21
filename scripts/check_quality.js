const fs = require('fs');
const path = require('path');

async function checkQuality() {
    console.log('Sampling movie descriptions...');
    const samples = [];

    for (let i = 1; i <= 3; i++) {
        const filePath = path.join('public', `movies_part${i}.json`);
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const movies = JSON.parse(raw);

            // Pick 3 random movies per file
            for (let j = 0; j < 3; j++) {
                const random = movies[Math.floor(Math.random() * movies.length)];
                samples.push({
                    title: random.title,
                    descLength: random.description ? random.description.length : 0,
                    descSnippet: random.description ? random.description.substring(0, 50) + '...' : 'NULL'
                });
            }
        }
    }

    console.table(samples);
}

checkQuality();
