// @ts-nocheck
import { readFileSync } from 'fs';
import { join } from 'path';

try {
    const path = join(process.cwd(), 'public/movies.json');
    console.log(`Reading ${path}...`);
    const raw = readFileSync(path, 'utf-8');
    const movies = JSON.parse(raw);

    console.log(`Total Movies in JSON: ${movies.length}`);

    let seoCount = 0;
    let streamingCount = 0;
    let rentBuyCount = 0;

    movies.forEach(m => {
        if (m.whyWatch && m.whyWatch.length > 0) seoCount++;
        if (m.streamingLinks && m.streamingLinks.length > 0) {
            streamingCount++;
            if (m.streamingLinks.some(l => l.url && (l.url.includes('apple') || l.url.includes('amazon')))) {
                rentBuyCount++;
            }
        }
    });

    console.log(`Movies with SEO (whyWatch): ${seoCount}`);
    console.log(`Movies with Streaming: ${streamingCount}`);
    console.log(`Movies with Rent/Buy: ${rentBuyCount}`);

    const mh = movies.find(m => m.id === 'tmdb-71446' || m.title === 'Money Heist');
    if (mh) {
        console.log(`\nMoney Heist JSON State:`);
        console.log(`- Title: ${mh.title}`);
        console.log(`- Seasons: ${mh.seasons?.length}`);
        console.log(`- Streaming: ${mh.streamingLinks?.length}`);
    }

} catch (e) {
    console.error(e);
}
