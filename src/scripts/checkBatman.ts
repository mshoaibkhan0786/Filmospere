
// @ts-nocheck
import { manualMovies } from '../data/manualMovies.ts';

const batman = manualMovies.find(m => m.id === 'tmdb-2022');

if (batman) {
    console.log('Found The Batman (tmdb-2022) in manualMovies.ts');
    console.log('Streaming Links:', JSON.stringify(batman.streamingLinks, null, 2));
} else {
    console.log('❌ The Batman (tmdb-2022) NOT found in manualMovies.ts');
}
