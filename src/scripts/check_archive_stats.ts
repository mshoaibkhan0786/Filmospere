import fs from 'fs';
import path from 'path';

function getStats(filePath: string, label: string) {
    if (!fs.existsSync(filePath)) {
        console.log(`${label}: File not found.`);
        return;
    }

    try {
        console.log(`Reading ${label}...`);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const movies = JSON.parse(raw);

        const castSet = new Set<string>();
        const directorSet = new Set<string>();

        movies.forEach((m: any) => {
            // Cast
            if (m.cast && Array.isArray(m.cast)) {
                m.cast.forEach((c: any) => {
                    // Use Name + ID combination or just Name to mimic DB distinctness
                    const key = c.name;
                    if (key) castSet.add(key);
                });
            }

            // Director
            if (m.director) {
                const directors = m.director.split(',').map((d: string) => d.trim());
                directors.forEach((d: string) => {
                    if (d) directorSet.add(d);
                });
            }
        });

        console.log(`--- ${label} ---`);
        console.log(`Total Movies: ${movies.length}`);
        console.log(`Unique Cast: ${castSet.size}`);
        console.log(`Unique Directors: ${directorSet.size}`);

    } catch (e) {
        console.error(`Error reading ${label}:`, e.message);
    }
}

getStats(path.resolve(process.cwd(), '_archive/tmdbMovies.json'), 'TMDB Archive');
getStats(path.resolve(process.cwd(), '_archive/movies.json'), 'Movies Archive');
