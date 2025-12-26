import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAIN_CATEGORIES = [
    'Action', 'Adventure', 'Animation', 'Anime', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery',
    'Romance', 'Sci-Fi', 'Thriller'
];

function fetchSparql(query) {
    return new Promise((resolve, reject) => {
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
        const options = {
            headers: {
                'User-Agent': 'Moviepedia/1.0 (mailto:your-email@example.com)',
                'Accept': 'application/json'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.results.bindings);
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error.message}. Data snippet: ${data.substring(0, 100)}`));
                }
            });
        }).on('error', reject);
    });
}

// Helper to format currency
const formatCurrency = (amount) => {
    if (!amount) return undefined;
    const num = parseFloat(amount);
    if (isNaN(num)) return undefined;

    if (num >= 1000000000) {
        return `$${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`;
    }
    return `$${num.toLocaleString()}`;
};

// --- New Queries for Big Batch ---

const movies2023Query = `
SELECT ?item ?itemLabel (SAMPLE(?description) AS ?description) (SAMPLE(?date) AS ?date) (SAMPLE(?duration) AS ?duration) (SAMPLE(?poster) AS ?poster) (SAMPLE(?budget) AS ?budget) (SAMPLE(?boxOffice) AS ?boxOffice) ?sitelinks (GROUP_CONCAT(DISTINCT ?genreLabel; separator=", ") AS ?genres) (GROUP_CONCAT(DISTINCT ?directorLabel; separator=", ") AS ?directors) (GROUP_CONCAT(DISTINCT ?langLabel; separator=", ") AS ?languages) (GROUP_CONCAT(DISTINCT ?castInfo; separator="||") AS ?castMembers) WHERE {
  ?item wdt:P31 wd:Q11424. 
  
  OPTIONAL { ?item wdt:P3383 ?poster1. }
  OPTIONAL { ?item wdt:P18 ?poster2. }
  BIND(COALESCE(?poster1, ?poster2) AS ?poster)
  FILTER(BOUND(?poster))

  ?item wdt:P577 ?date. FILTER(YEAR(?date) = 2023)
  ?item wikibase:sitelinks ?sitelinks.
  
  OPTIONAL { ?item wdt:P2047 ?duration. }
  OPTIONAL { ?item wdt:P2130 ?budget. }
  OPTIONAL { ?item wdt:P2142 ?boxOffice. }
  OPTIONAL { ?item wdt:P136 ?genre. ?genre rdfs:label ?genreLabel. FILTER(LANG(?genreLabel) = "en") }
  OPTIONAL { ?item wdt:P364 ?lang. ?lang rdfs:label ?langLabel. FILTER(LANG(?langLabel) = "en") }
  OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description) = "en") }
  OPTIONAL { ?item wdt:P57 ?director. ?director rdfs:label ?directorLabel. FILTER(LANG(?directorLabel) = "en") }
  OPTIONAL { 
    ?item wdt:P161 ?cast. 
    ?cast rdfs:label ?castLabel. 
    FILTER(LANG(?castLabel) = "en")
    BIND(CONCAT(STR(?cast), ";", ?castLabel) AS ?castInfo)
  }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?item ?itemLabel ?sitelinks
ORDER BY DESC(?sitelinks)
LIMIT 800
`;

const movies2022Query = `
SELECT ?item ?itemLabel (SAMPLE(?description) AS ?description) (SAMPLE(?date) AS ?date) (SAMPLE(?duration) AS ?duration) (SAMPLE(?poster) AS ?poster) (SAMPLE(?budget) AS ?budget) (SAMPLE(?boxOffice) AS ?boxOffice) ?sitelinks (GROUP_CONCAT(DISTINCT ?genreLabel; separator=", ") AS ?genres) (GROUP_CONCAT(DISTINCT ?directorLabel; separator=", ") AS ?directors) (GROUP_CONCAT(DISTINCT ?langLabel; separator=", ") AS ?languages) (GROUP_CONCAT(DISTINCT ?castInfo; separator="||") AS ?castMembers) WHERE {
  ?item wdt:P31 wd:Q11424. 
  
  OPTIONAL { ?item wdt:P3383 ?poster1. }
  OPTIONAL { ?item wdt:P18 ?poster2. }
  BIND(COALESCE(?poster1, ?poster2) AS ?poster)
  FILTER(BOUND(?poster))

  ?item wdt:P577 ?date. FILTER(YEAR(?date) = 2022)
  ?item wikibase:sitelinks ?sitelinks.
  
  OPTIONAL { ?item wdt:P2047 ?duration. }
  OPTIONAL { ?item wdt:P2130 ?budget. }
  OPTIONAL { ?item wdt:P2142 ?boxOffice. }
  OPTIONAL { ?item wdt:P136 ?genre. ?genre rdfs:label ?genreLabel. FILTER(LANG(?genreLabel) = "en") }
  OPTIONAL { ?item wdt:P364 ?lang. ?lang rdfs:label ?langLabel. FILTER(LANG(?langLabel) = "en") }
  OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description) = "en") }
  OPTIONAL { ?item wdt:P57 ?director. ?director rdfs:label ?directorLabel. FILTER(LANG(?directorLabel) = "en") }
  OPTIONAL { 
    ?item wdt:P161 ?cast. 
    ?cast rdfs:label ?castLabel. 
    FILTER(LANG(?castLabel) = "en")
    BIND(CONCAT(STR(?cast), ";", ?castLabel) AS ?castInfo)
  }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?item ?itemLabel ?sitelinks
ORDER BY DESC(?sitelinks)
LIMIT 800
`;

const bollywood2010sQuery = `
SELECT ?item ?itemLabel (SAMPLE(?description) AS ?description) (SAMPLE(?date) AS ?date) (SAMPLE(?duration) AS ?duration) (SAMPLE(?poster) AS ?poster) (SAMPLE(?budget) AS ?budget) (SAMPLE(?boxOffice) AS ?boxOffice) ?sitelinks (GROUP_CONCAT(DISTINCT ?genreLabel; separator=", ") AS ?genres) (GROUP_CONCAT(DISTINCT ?directorLabel; separator=", ") AS ?directors) (GROUP_CONCAT(DISTINCT ?langLabel; separator=", ") AS ?languages) (GROUP_CONCAT(DISTINCT ?castInfo; separator="||") AS ?castMembers) WHERE {
  ?item wdt:P31 wd:Q11424. 
  ?item wdt:P495 wd:Q668. # India
  
  OPTIONAL { ?item wdt:P3383 ?poster1. }
  OPTIONAL { ?item wdt:P18 ?poster2. }
  BIND(COALESCE(?poster1, ?poster2) AS ?poster)
  FILTER(BOUND(?poster))

  ?item wdt:P577 ?date. FILTER(YEAR(?date) >= 2010 && YEAR(?date) <= 2019)
  ?item wikibase:sitelinks ?sitelinks.
  
  OPTIONAL { ?item wdt:P2047 ?duration. }
  OPTIONAL { ?item wdt:P2130 ?budget. }
  OPTIONAL { ?item wdt:P2142 ?boxOffice. }
  OPTIONAL { ?item wdt:P136 ?genre. ?genre rdfs:label ?genreLabel. FILTER(LANG(?genreLabel) = "en") }
  OPTIONAL { ?item wdt:P364 ?lang. ?lang rdfs:label ?langLabel. FILTER(LANG(?langLabel) = "en") }
  OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description) = "en") }
  OPTIONAL { ?item wdt:P57 ?director. ?director rdfs:label ?directorLabel. FILTER(LANG(?directorLabel) = "en") }
  OPTIONAL { 
    ?item wdt:P161 ?cast. 
    ?cast rdfs:label ?castLabel. 
    FILTER(LANG(?castLabel) = "en")
    BIND(CONCAT(STR(?cast), ";", ?castLabel) AS ?castInfo)
  }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?item ?itemLabel ?sitelinks
ORDER BY DESC(?sitelinks)
LIMIT 600
`;


async function main() {
    console.log('Fetching NEW Batch of Movies from Wikidata...');

    // 1. Load Existing Movies
    const existingMoviesPath = path.join(__dirname, '../src/data/wikidataMovies.ts');
    let existingMovies = [];
    try {
        if (fs.existsSync(existingMoviesPath)) {
            const fileContent = fs.readFileSync(existingMoviesPath, 'utf-8');
            // Extract JSON array from the TS file content
            const jsonMatch = fileContent.match(/export const wikidataMovies: Movie\[\] = (\[[\s\S]*\]);/);
            if (jsonMatch && jsonMatch[1]) {
                existingMovies = JSON.parse(jsonMatch[1]);
                console.log(`Loaded ${existingMovies.length} existing movies.`);
            } else {
                console.warn('Could not parse existing movies file. Starting fresh.');
            }
        }
    } catch (e) {
        console.error('Error loading existing movies:', e.message);
    }

    // Initialize map with existing movies
    const movieMap = new Map();
    existingMovies.forEach(m => {
        // Ensure tags is a Set for processing (will convert back to array later)
        movieMap.set(m.id, { ...m, tags: new Set(m.tags) });
    });

    try {
        // 2. Fetch New Data
        console.log('Fetching 2023 Movies...');
        let movies2023Bindings = [];
        try {
            movies2023Bindings = await fetchSparql(movies2023Query);
        } catch (e) {
            console.error('Failed to fetch 2023 Movies:', e.message);
        }

        console.log('Fetching 2022 Movies...');
        let movies2022Bindings = [];
        try {
            movies2022Bindings = await fetchSparql(movies2022Query);
        } catch (e) {
            console.error('Failed to fetch 2022 Movies:', e.message);
        }

        console.log('Fetching Bollywood Movies (2010-2019)...');
        let bollywood2010sBindings = [];
        try {
            bollywood2010sBindings = await fetchSparql(bollywood2010sQuery);
        } catch (e) {
            console.error('Failed to fetch Bollywood 2010s Movies:', e.message);
        }

        console.log(`Fetched ${movies2023Bindings.length} 2023 movies, ${movies2022Bindings.length} 2022 movies, ${bollywood2010sBindings.length} Bollywood 2010s movies.`);

        const allNewBindings = [
            ...movies2023Bindings,
            ...movies2022Bindings,
            ...bollywood2010sBindings
        ];

        // 3. Process and Merge
        allNewBindings.forEach(item => {
            const id = item.item.value.split('/').pop();

            // Only process if not already in map (or update if needed, but here we preserve old)
            if (!movieMap.has(id)) {
                const dateObj = item.date ? new Date(item.date.value) : null;
                const releaseYear = dateObj ? dateObj.getFullYear() : 'N/A';
                const releaseDate = dateObj ? dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

                const durationMinutes = item.duration ? parseFloat(item.duration.value) : 0;
                const hours = Math.floor(durationMinutes / 60);
                const minutes = Math.round(durationMinutes % 60);
                const durationStr = durationMinutes > 0 ? `${hours}h ${minutes}m` : 'N/A';

                let language = 'English';
                let languages = ['English'];

                if (item.languages) {
                    languages = item.languages.value.split(', ');
                    language = languages[0];
                } else if (item.langLabel) {
                    language = item.langLabel.value;
                    languages = [language];
                }

                const castList = item.castMembers ? item.castMembers.value.split('||').slice(0, 10).map(castStr => {
                    const parts = castStr.split(';');
                    const castId = parts[0] ? parts[0].split('/').pop() : '';
                    const name = parts[1] || 'Unknown';
                    return {
                        id: castId,
                        name: name,
                        role: 'Actor',
                        imageUrl: ''
                    };
                }) : [];

                let posterUrl = item.poster ? item.poster.value : null;

                const newMovie = {
                    id: id,
                    title: item.itemLabel.value,
                    releaseYear: releaseYear,
                    releaseDate: releaseDate,
                    budget: formatCurrency(item.budget ? item.budget.value : null),
                    boxOffice: formatCurrency(item.boxOffice ? item.boxOffice.value : null),
                    duration: durationStr,
                    posterUrl: posterUrl,
                    director: item.directors ? item.directors.value.split(', ')[0] : 'Unknown',
                    description: item.description ? item.description.value : 'No description available.',
                    rating: parseFloat((Math.random() * 2 + 7).toFixed(1)),
                    voteCount: parseInt(item.sitelinks.value || '0') * 100,
                    views: parseInt(item.sitelinks.value || '0') * 1000,
                    tags: new Set(['Imported']),
                    cast: castList,
                    trailerUrl: '',
                    streamingLinks: [],
                    isCopyrightFree: false,
                    contentType: 'movie',
                    language: language,
                    languages: languages,
                    images: posterUrl ? [posterUrl] : []
                };

                if (item.genres) {
                    const genres = item.genres.value.split(', ');
                    genres.forEach(genre => {
                        if (MAIN_CATEGORIES.includes(genre)) {
                            newMovie.tags.add(genre);
                        } else if (genre.toLowerCase().includes('science fiction')) {
                            newMovie.tags.add('Sci-Fi');
                        } else if (genre.toLowerCase().includes('romantic')) {
                            newMovie.tags.add('Romance');
                        } else if (genre.toLowerCase().includes('animated')) {
                            newMovie.tags.add('Animation');
                        } else if (genre.toLowerCase().includes('thriller')) {
                            newMovie.tags.add('Thriller');
                        } else if (genre.toLowerCase().includes('horror')) {
                            newMovie.tags.add('Horror');
                        } else if (genre.toLowerCase().includes('comedy')) {
                            newMovie.tags.add('Comedy');
                        } else if (genre.toLowerCase().includes('action')) {
                            newMovie.tags.add('Action');
                        } else if (genre.toLowerCase().includes('drama')) {
                            newMovie.tags.add('Drama');
                        } else if (/^[A-Z][a-z]+$/.test(genre)) {
                            newMovie.tags.add(genre);
                        }
                    });
                }

                movieMap.set(id, newMovie);
            }
        });

        // 4. Sort and Save
        const sortedMovies = Array.from(movieMap.values()).map(m => ({ ...m, tags: Array.from(m.tags) }));
        sortedMovies.sort((a, b) => {
            const aHasPoster = a.posterUrl ? 1 : 0;
            const bHasPoster = b.posterUrl ? 1 : 0;
            return bHasPoster - aHasPoster;
        });

        console.log(`Total unique items after merge: ${sortedMovies.length}`);

        const tsContent = `import type { Movie } from '../types';

export const wikidataMovies: Movie[] = ${JSON.stringify(sortedMovies, null, 4)};
`;

        fs.writeFileSync(existingMoviesPath, tsContent);
        console.log(`Saved merged data to ${existingMoviesPath}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
