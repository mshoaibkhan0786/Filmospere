// @ts-nocheck
import { manualMovies as movies } from '../data/manualMovies';

console.log(`Checking manualMovies.ts...`);
console.log(`Total Movies: ${movies.length}`);

let streamingCount = 0;
let seoCount = 0;

movies.forEach(m => {
    if (m.streamingLinks && m.streamingLinks.length > 0) streamingCount++;
    if (m.whyWatch && m.whyWatch.length > 0) seoCount++;
});

console.log(`In manualMovies.ts:`);
console.log(`- Streaming Links: ${streamingCount}`);
console.log(`- SEO (whyWatch): ${seoCount}`);
