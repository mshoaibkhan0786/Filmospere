import fs from 'fs';
const movies = JSON.parse(fs.readFileSync('public/movies.json', 'utf8'));
const movie = movies.find(m => m.title.includes('Vidaamuyarchi') || m.slug?.includes('vidaamuyarchi') || m.id === 'vidaamuyarchi');

if (movie) {
    console.log('Movie Found:', movie.title);
    console.log('WhyWatch Count:', movie.whyWatch ? movie.whyWatch.length : 0);
    console.log('WhyWatch Items:', movie.whyWatch);
} else {
    console.log('Movie not found');
}
