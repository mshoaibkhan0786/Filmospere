import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

const ADULT_KEYWORDS = [
    'porn', 'erotic', 'sex', 'nude', 'incest', 'taboo', 'xxx', 'hentai', 'uncensored', 'nudity', 'lust', 'passion', 'adult', '18+'
];

const ADULT_GENRES = [
    'Adult', 'Erotica', 'Hentai', 'Pink Movie'
];

const ADULT_CERTS = [
    'NC-17', 'X', 'R18+', 'R21'
];

async function detect() {
    console.log('🔍 Starting Adult Content Detection...');

    let allMovies: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let more = true;

    // Fetch All Movies
    console.log('Fetching all movies...');
    while (more) {
        const { data, error } = await supabase
            .from('movies')
            .select('id, title, data')
            .range(from, from + batchSize - 1);

        if (error) {
            console.error('Fetch error:', error);
            break;
        }

        if (data && data.length > 0) {
            const flattened = data.map(r => ({ ...r.data, id: r.id }));
            allMovies = [...allMovies, ...flattened];
            from += batchSize;
            process.stdout.write(`.`); // Progress Dot
        } else {
            more = false;
        }
    }
    console.log(`\n✅ Scanned ${allMovies.length} movies.`);

    const flagged: any[] = [];

    for (const movie of allMovies) {
        let reasons: string[] = [];

        // 1. Check Explicit Genres (Tags)
        if (movie.tags) {
            const foundGenres = movie.tags.filter((t: string) => ADULT_GENRES.some(g => t.toLowerCase() === g.toLowerCase()));
            if (foundGenres.length > 0) reasons.push(`Genre: ${foundGenres.join(', ')}`);
        }

        // 2. Check Certifications (Hidden Tags)
        if (movie.hiddenTags) {
            const foundCerts = movie.hiddenTags.filter((t: string) => ADULT_CERTS.includes(t.toUpperCase()));
            if (foundCerts.length > 0) reasons.push(`Cert: ${foundCerts.join(', ')}`);
        }

        // 3. Keyword Search in Title (High Confidence)
        const lowerTitle = movie.title.toLowerCase();
        // strict word boundaries for short words
        const foundKeywords = ADULT_KEYWORDS.filter(k => {
            const regex = new RegExp(`\\b${k}\\b`, 'i');
            return regex.test(lowerTitle);
        });

        if (foundKeywords.length > 0) {
            // Exclude common false positives if necessary (e.g. "Sex and the City")
            // For now, flag it for review.
            reasons.push(`Title Keyword: ${foundKeywords.join(', ')}`);
        }

        // 4. TMDB Adult Flag
        if (movie.adult === true) {
            reasons.push('TMDB Adult Flag');
        }

        if (reasons.length > 0) {
            flagged.push({
                id: movie.id,
                title: movie.title,
                reasons: reasons,
                year: movie.releaseYear
            });
        }
    }

    console.log(`\n🚩 Found ${flagged.length} potential adult movies.`);

    if (flagged.length > 0) {
        const outputPath = path.join(__dirname, 'adult_candidates.json');
        fs.writeFileSync(outputPath, JSON.stringify(flagged, null, 2));
        console.log(`Saved list to ${outputPath}`);
    } else {
        console.log('No adult content found.');
    }
}

detect().catch(console.error);
