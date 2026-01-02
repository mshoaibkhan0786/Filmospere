import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public', 'movies_part1.json');

try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const movies = JSON.parse(data);

    // Sort by voteCount descending
    movies.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

    // Get top movie with a valid poster
    const topMovie = movies.find(m => m.posterUrl && !m.posterUrl.includes('null'));

    if (topMovie) {
        console.log(JSON.stringify({
            title: topMovie.title,
            posterUrl: topMovie.posterUrl,
            voteCount: topMovie.voteCount
        }, null, 2));
    } else {
        console.error('No valid movie found');
    }

} catch (e) {
    console.error(e);
}
