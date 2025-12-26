const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = '1d1bdbc1';

const fetchUrl = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (e) => reject(e));
    });
};

const fetchMovie = (title) => {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`;
    return fetchUrl(url).then(parsed => {
        if (parsed.Response === 'False') {
            console.error(`Error fetching ${title}: ${parsed.Error}`);
            return null;
        }
        return parsed;
    });
};

const fetchSeason = (title, seasonNum) => {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&Season=${seasonNum}&apikey=${API_KEY}`;
    return fetchUrl(url).then(parsed => {
        if (parsed.Response === 'False') return null;
        return parsed;
    });
};

const fetchAllSeasons = async (title, totalSeasons) => {
    const seasons = [];
    const limit = Math.min(parseInt(totalSeasons) || 0, 15);
    console.log(`  Fetching ${limit} seasons for ${title}...`);

    for (let i = 1; i <= limit; i++) {
        const seasonData = await fetchSeason(title, i);
        if (seasonData && seasonData.Episodes) {
            seasons.push({
                seasonNumber: i,
                episodes: seasonData.Episodes.map(ep => ({
                    id: ep.imdbID,
                    title: ep.Title,
                    duration: 'N/A',
                    description: `Episode ${ep.Episode} of Season ${i}`,
                    releaseDate: ep.Released,
                    episodeNumber: parseInt(ep.Episode) || 0
                }))
            });
        }
        await new Promise(r => setTimeout(r, 100)); // Rate limiting
    }
    return seasons;
};

const main = async () => {
    const outputPath = path.join(__dirname, '../src/data/omdbMovies.ts');
    let content = fs.readFileSync(outputPath, 'utf-8');

    // Extract array
    const startIndex = content.indexOf('[');
    const endIndex = content.lastIndexOf(']');
    if (startIndex === -1 || endIndex === -1) process.exit(1);

    const arrayString = content.substring(startIndex, endIndex + 1);

    // Use eval to parse flexible JSON (unquoted keys if/when used)
    let movies = eval(arrayString);

    // Identify targets
    const targets = movies.filter(m => {
        if (m.contentType !== 'series') return false;

        // Check for missing seasons
        if (!m.seasons || m.seasons.length === 0) return true;

        // Check for empty seasons (optional safety)
        const hasEmpty = m.seasons.some(s => !s.episodes || s.episodes.length === 0);
        if (hasEmpty) return true;

        return false;
    });

    console.log(`Found ${targets.length} series to update.`);

    for (const movie of targets) {
        console.log(`Updating ${movie.title}...`);

        // Refetch basics to get accurate totalSeasons
        const fullData = await fetchMovie(movie.title);

        if (fullData) {
            // Update totalSeasons if available
            if (fullData.totalSeasons) {
                movie.totalSeasons = fullData.totalSeasons;
            }

            const seasons = await fetchAllSeasons(movie.title, movie.totalSeasons);
            if (seasons.length > 0) {
                movie.seasons = seasons;
                console.log(`  Updated ${movie.title} with ${seasons.length} seasons.`);
            } else {
                console.log(`  No season data found for ${movie.title}.`);
            }
        }

        await new Promise(r => setTimeout(r, 100));
    }

    // Write back
    const fileContent = `import type { Movie } from '../types';

export const omdbMovies: Movie[] = ${JSON.stringify(movies, null, 4)};
`;

    fs.writeFileSync(outputPath, fileContent);
    console.log(`Updated omdbMovies.ts`);
};

main();
