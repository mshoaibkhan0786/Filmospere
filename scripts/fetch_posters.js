
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PARTS = ['wikidataMoviesPart1.ts', 'wikidataMoviesPart2.ts'];
const USER_AGENT = 'MoviepediaPosterBot/1.0 (mshoeb@example.com) based on wikidata-sdk';
const BATCH_SIZE = 5; // Process 5 movies at a time
const DELAY_MS = 1000; // 1 second delay between batches

// URLs
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';

// Placeholders to identify
const PLACEHOLDERS = [
    "",
    "N/A",
    "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=600&q=80",
    "http://www.wikidata.org/.well-known/genid/", // Invalid genid URLs often fail or are placeholders
];

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url) {
    try {
        const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        // console.error(`Fetch error for ${url}:`, error.message);
        return null;
    }
}

async function getWikidataImage(qid) {
    if (!qid || !qid.startsWith('Q')) return null;

    // 1. Get Wikidata Item
    // using wbgetentities to get P18
    const url = `${WIKIDATA_API}?action=wbgetclaims&format=json&entity=${qid}&property=P18`;
    const data = await fetchJson(url);

    if (!data || !data.claims || !data.claims.P18 || !data.claims.P18[0]) {
        return null;
    }

    const value = data.claims.P18[0].mainsnak.datavalue.value;
    if (!value) return null;

    const fileName = value.replace(/ /g, '_'); // Replace spaces with underscores for the file query

    // 2. Get Wikimedia Thumbnail URL
    // P18 is a filename on Commons. We need the actual URL.
    // Using imageinfo with iiurlwidth to get a thumbnail
    const fileTitle = `File:${fileName}`;
    const commonsUrl = `${WIKIMEDIA_API}?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json`;

    const commonsData = await fetchJson(commonsUrl);

    if (!commonsData || !commonsData.query || !commonsData.query.pages) {
        return null;
    }

    const pages = commonsData.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId === "-1") return null;

    const page = pages[pageId];
    if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].thumburl) {
        return page.imageinfo[0].thumburl;
    }

    // Fallback to original url if thumburl is missing (unlikely if width requested)
    if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
        return page.imageinfo[0].url;
    }

    return null;
}

function isMissingPoster(posterUrl) {
    if (!posterUrl) return true;
    if (posterUrl === "N/A") return true;
    if (posterUrl.includes("unsplash.com")) return true;
    // Check for genid which are often broken or internal IDs not suitable for display
    if (posterUrl.includes(".well-known/genid")) return true;
    return false;
}

// Simple regex parser/serializer for the TS files
// We assume the file structure is `export const wikidataMoviesPartX: any[] = [ ... ];`
function parseTsFile(content) {
    const startMatch = content.indexOf('[');
    const endMatch = content.lastIndexOf(']');
    if (startMatch === -1 || endMatch === -1) throw new Error("Could not find array in file");

    const jsonStr = content.substring(startMatch, endMatch + 1);

    // JSON.parse is strict. usage of single quotes or trailing commas in the TS file will fail.
    // We'll use a safer eval approach since we're in a dev environment/script or try to clean it.
    // However, the files seem to be standard JSON syntax wrapped in TS export, possibly with some non-JSON features.
    // Let's rely on standard JSON.parse but first replace single quotes if they are used for properties/strings not containing single quotes.
    // Actually, looking at the previous `view_file` output (Step 21), it seems to be valid JSON format (double quotes everywhere) 
    // INSIDE the array, except maybe comments or trailing commas?
    // Step 21 shows keys are quoted with double quotes: "id": "Q25188". Valid JSON.
    // It is just wrapped in `export const ... = ` and `;`.
    // Let's try JSON.parse. If it fails, we might need a more robust parser (like `eval` in a safe sandbox or stripping comments).

    // WARNING: The file has comments (e.g. line 32 in Step 6 view_file of constants.ts, wait, Step 21 was the data file).
    // Step 21 has no comments visible in the JSON part.
    // But `constants.ts` had comments. Data files usually don't have comments if generated.
    // Let's try to parse.

    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.log("JSON parse failed, trying safe eval...");
        // basic cleanup for trailing commas
        const cleaned = jsonStr.replace(/,(\s*])/g, '$1');
        try {
            return JSON.parse(cleaned);
        } catch (e2) {
            console.error("Failed to parse file content. It might contain JS specific syntax.");
            // Fallback: Using Function constructor to eval object (be careful)
            return new Function("return " + jsonStr)();
        }
    }
}

async function processFile(fileName) {
    const filePath = path.join(__dirname, '../src/data', fileName);
    if (!fs.existsSync(filePath)) {
        console.warn(`File ${fileName} not found, skipping.`);
        return;
    }

    console.log(`Processing ${fileName}...`);
    let rawContent = fs.readFileSync(filePath, 'utf8');

    // We need to preserve the wrapper
    const header = rawContent.substring(0, rawContent.indexOf('['));
    const footer = rawContent.substring(rawContent.lastIndexOf(']') + 1);

    let movies;
    try {
        movies = parseTsFile(rawContent);
    } catch (e) {
        console.error(`Error parsing ${fileName}:`, e);
        return;
    }

    let modifiedCount = 0;
    const missingMovies = movies.filter(m => isMissingPoster(m.posterUrl));

    console.log(`Found ${missingMovies.length} items with missing/invalid posters out of ${movies.length}.`);

    for (let i = 0; i < missingMovies.length; i += BATCH_SIZE) {
        const batch = missingMovies.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (movie) => {
            console.log(`[${i + 1}/${missingMovies.length}] Checking ${movie.title} (${movie.id})...`);

            try {
                const newPoster = await getWikidataImage(movie.id);

                if (newPoster) {
                    // Update in the main array reference
                    const originalMovie = movies.find(m => m.id === movie.id);
                    if (originalMovie) {
                        originalMovie.posterUrl = newPoster;
                        // Also update images array if it's empty or has the bad one
                        if (!originalMovie.images || originalMovie.images.length === 0 || isMissingPoster(originalMovie.images[0])) {
                            originalMovie.images = [newPoster];
                        }
                        modifiedCount++;
                        console.log(`  ✅ Updated: ${movie.title} -> ${newPoster}`);
                    }
                } else {
                    console.log(`  ❌ No image found for ${movie.title}`);
                }
            } catch (err) {
                console.error(`  ⚠️ Error processing ${movie.title}:`, err.message);
            }
        }));

        if (i + BATCH_SIZE < missingMovies.length) {
            await sleep(DELAY_MS);
        }
    }

    if (modifiedCount > 0) {
        const newContent = header + JSON.stringify(movies, null, 4) + footer;
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`\nSaved ${modifiedCount} updates to ${fileName}`);
    } else {
        console.log(`\nNo updates needed for ${fileName}`);
    }
}

async function main() {
    console.log("Starting poster fetch process...");
    for (const part of PARTS) {
        await processFile(part);
    }
    console.log("Done!");
}

main();
