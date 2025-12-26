import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLanguageData() {
    console.log('Scanning for corrupted language data (?????)...');

    // 1. Fetch all movies (pagination needed if huge, but 10k might fit or we do cursor)
    // For safety, let's process in chunks or just fetch ones that likely have issues?
    // ILIKE %?????% might not work as expected with Supabase JSON filtering on array.
    // Let's fetch all and filter in JS for safety/ease, assuming < 20k rows.

    // Actually, fetching 10k rows is heavy.
    // Let's try to fetch where data->languages contains '?????'
    // But JSONB containment of '?????' string in array is tricky.

    // Let's just fetch everything for now (or top 1000 recently qualified).
    // Or iterate. 
    // Let's fetch all. 5MB JSON is manageable in Node.

    const { data: movies, error } = await supabase
        .from('movies')
        .select('*');

    if (error) {
        console.error('Error fetching movies:', error);
        return;
    }

    if (!movies || movies.length === 0) {
        console.log('No movies found.');
        return;
    }

    console.log(`Fetched ${movies.length} movies. Checking for '?????'...`);

    let updateCount = 0;

    for (const row of movies) {
        const movie = row.data;
        let changed = false;

        // Check languages array
        if (movie.languages && Array.isArray(movie.languages)) {
            const pattern = /\?{2,}/; // Matches ?? or more

            // Check if any language is garbage
            const hasGarbage = movie.languages.some((l: string) => pattern.test(l) || l === '');

            if (hasGarbage) {
                console.log(`[${row.title}] Found corrupted languages:`, movie.languages);

                // Filter out garbage
                const cleanLanguages = movie.languages.filter((l: string) => !pattern.test(l) && l !== '');

                // If distinct valid languages remain, use them
                if (cleanLanguages.length > 0) {
                    movie.languages = cleanLanguages;
                } else {
                    // Fallback to root language if valid
                    if (movie.language && !pattern.test(movie.language) && movie.language !== 'N/A') {
                        movie.languages = [movie.language];
                        console.log(`  -> Replaced with root language: ${movie.language}`);
                    } else {
                        // Try originalLanguage if typical ISO
                        if (movie.originalLanguage && movie.originalLanguage.length === 2) {
                            movie.languages = [movie.originalLanguage]; // e.g. 'kn'
                            console.log(`  -> Replaced with originalLanguage: ${movie.originalLanguage}`);
                        } else {
                            movie.languages = null; // Remove array so it falls back to whatever display logic (or empty)
                            console.log(`  -> Cleared languages array (no fallback found)`);
                        }
                    }
                }
                changed = true;
            }
        }

        // Also fix root language if it is nonsense
        if (movie.language && /\?{2,}/.test(movie.language)) {
            console.log(`[${row.title}] Corrupted root language: ${movie.language}`);
            // If we have valid languages array, take first
            if (movie.languages && movie.languages.length > 0) {
                movie.language = movie.languages[0];
                changed = true;
            } else {
                movie.language = 'Unknown';
                changed = true;
            }
        }

        if (changed) {
            updateCount++;
            // Update Supabase
            const { error: updateError } = await supabase
                .from('movies')
                .update({ data: movie })
                .eq('id', row.id);

            if (updateError) {
                console.error(`Failed to update ${row.title}:`, updateError);
            } else {
                console.log(`  -> Saved fix for ${row.title}`);
            }
        }
    }

    console.log(`\nFinished! Fixed ${updateCount} movies.`);
}

fixLanguageData();
