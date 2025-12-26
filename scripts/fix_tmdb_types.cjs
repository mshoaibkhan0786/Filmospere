const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/tmdbMovies.ts');

try {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Extract JSON array
    const match = content.match(/export const tmdbMovies: Movie\[] = (\[[\s\S]*\]);/);
    if (!match) {
        throw new Error('Could not find movie array');
    }

    let movies = JSON.parse(match[1].replace(/,(\s*])/g, '$1'));

    // Fix types
    movies = movies.map(m => {
        // Required strings fallback
        if (m.description === null) m.description = '';
        if (m.director === null) m.director = 'Unknown';
        if (m.duration === null) m.duration = 'N/A';
        if (m.posterUrl === null) m.posterUrl = '';
        
        // Optional strings -> undefined
        if (m.releaseDate === null) m.releaseDate = undefined;
        if (m.budget === null) m.budget = undefined;
        if (m.boxOffice === null) m.boxOffice = undefined;
        if (m.trailerUrl === null) m.trailerUrl = undefined;
        if (m.videoUrl === null) m.videoUrl = undefined;
        if (m.language === null) m.language = undefined;
        if (m.totalSeasons === null) m.totalSeasons = undefined;

        // Arrays
        if (!m.tags) m.tags = [];
        if (!m.cast) m.cast = [];
        if (!m.streamingLinks) m.streamingLinks = [];
        
        // Nested: Seasons & Episodes
        if (m.seasons) {
            m.seasons.forEach(season => {
               if (season.episodes) {
                   season.episodes.forEach(ep => {
                       if (ep.releaseDate === null) ep.releaseDate = undefined;
                       if (ep.thumbnailUrl === null) ep.thumbnailUrl = undefined;
                       if (ep.description === null) ep.description = '';
                   });
               } 
            });
        }

        return m;
    });

    const newContent = `import type { Movie } from '../types';

export const tmdbMovies: Movie[] = ${JSON.stringify(movies, null, 4)};
`;

    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed ${movies.length} movies (including episodes).`);

} catch (err) {
    console.error('Error fixing file:', err);
    process.exit(1);
}
