import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../docs/query.json');

try {
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const wikidataMovies = JSON.parse(rawData);

    const processedMovies = wikidataMovies.map((item, index) => {
        const releaseYear = new Date(item.releaseDate).getFullYear();
        const durationMinutes = item.duration ? parseInt(item.duration) : 0;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationStr = durationMinutes > 0 ? `${hours}h ${minutes}m` : 'N/A';

        // Extract ID from Wikidata URL (e.g., Q29446)
        const wikidataId = item.movie.split('/').pop();

        return {
            id: `wd_${wikidataId}`,
            title: item.movieLabel,
            posterUrl: item.poster || 'https://via.placeholder.com/300x450?text=No+Poster',
            images: [item.poster || 'https://via.placeholder.com/800x450?text=No+Image'],
            description: `Imported from Wikidata. Release date: ${item.releaseDate.split('T')[0]}.`,
            releaseYear: releaseYear,
            duration: durationStr,
            director: 'Unknown',
            views: Math.floor(Math.random() * 10000), // Random views for demo
            tags: ['Imported'],
            cast: [],
            trailerUrl: '',
            streamingLinks: [],
            rating: parseFloat((Math.random() * 5 + 5).toFixed(1)), // Random rating 5.0-10.0
            voteCount: Math.floor(Math.random() * 1000),
            isCopyrightFree: false,
            contentType: 'movie'
        };
    });

    // Remove duplicates based on ID
    const uniqueMovies = Array.from(new Map(processedMovies.map(m => [m.id, m])).values());

    console.log(JSON.stringify(uniqueMovies, null, 2));

} catch (error) {
    console.error('Error processing Wikidata:', error);
}
