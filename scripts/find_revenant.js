const fs = require('fs');
const path = require('path');

async function findMovie() {
    console.log('Searching for "The Revenant"...');

    for (let i = 1; i <= 3; i++) {
        const filePath = path.join('public', `movies_part${i}.json`);
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const movies = JSON.parse(raw);

            const match = movies.find(m => m.title === 'The Revenant');
            if (match) {
                console.log('FOUND!');
                console.log(`Title: ${match.title}`);
                console.log(`Slug: ${match.slug}`);
                console.log(`Description: ${match.description}`);
                return;
            }
        }
    }
    console.log('Not found.');
}

findMovie();
