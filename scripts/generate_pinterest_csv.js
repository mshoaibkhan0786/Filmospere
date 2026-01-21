const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI
// Note: Ensure OPENAI_API_KEY is in your .env.local file
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const CSV_FILE = path.join(__dirname, '../pinterest_bulk_upload.csv');
const TRACKER_FILE = path.join(__dirname, '../.agent/pinterest_tracker.json');

// Global Board Name
const BOARD_NAME = 'Best Movies to Watch';

// --- TEMPLATES (FALLBACK) ---
function getPlotSnippet(overview) {
    if (!overview || overview.length < 10) return "Dive into the full plot, cast details, and reviews.";
    const match = overview.match(/^.*?[.!?]/);
    let snippet = match ? match[0] : overview.substring(0, 100) + '...';
    if (snippet.length > 150) snippet = snippet.substring(0, 147) + '...';
    return snippet;
}

const TEMPLATES = [
    (m, plot) => `Looking for a review of ${m.title}? ${plot} We rated this ${m.genres[0]} movie ${m.rating}/10. Check out the official movie poster and add it to your movies to watch list.`,
    (m, plot) => `${m.title} (${m.releaseYear}) is a must-watch ${m.genres[0]} film. Premise: ${plot} A stunning movie poster for a cinema classic. Definitely one of the best movies to watch.`,
    (m, plot) => `Is ${m.title} worth your time? ${plot} Find out why this is on our movies to watch list. View the high-res movie poster on Filmospere.`,
    (m, plot) => `Streaming guide for ${m.title}. ${plot} See the cast list and rating. A perfect addition to your movies to watch collection. (Movie Poster inside).`,
];

function getRandomDescriptionFallback(d) {
    const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const plot = getPlotSnippet(d.overview);
    const safeData = {
        title: d.title || 'Unknown Title',
        releaseYear: d.releaseYear || 'Unknown Year',
        rating: d.rating ? d.rating.toFixed(1) : 'NR',
        genres: (d.genres && d.genres.length > 0) ? d.genres : ['Cinema'],
        overview: d.overview
    };
    return template(safeData, plot);
}

function getCatchyTitleFallback(title, year, rating, genres) {
    let genre = genres[0];
    if (!genre || genre === 'Movie') genre = '';
    const templates = [
        genre ? `Best ${genre} Movies: ${title}` : `Best Movies to Watch: ${title}`,
        `${title} (${year}) - Review`,
        `Why ${title} is a Masterpiece`,
        `Underrated Gem: ${title}`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

// --- AI CONTENT GENERATION ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateAIContent(movie) {
    try {
        const prompt = `
        You are a Pinterest SEO expert for a movie website called Filmospere.com.
        
        Movie Details:
        Title: ${movie.title}
        Year: ${movie.releaseYear}
        Rating: ${movie.rating ? movie.rating.toFixed(1) : 'N/A'}/10
        Genre: ${movie.genres && movie.genres.length > 0 ? movie.genres[0] : 'Cinema'}
        Overview: ${movie.overview ? movie.overview.substring(0, 300) : 'No overview available.'}...

        Task: Create a highly engaging, non-generic Pinterest Pin Title and Description.
        
        Constraints:
        1. Title: Max 100 chars. Catchy, intriguing, or listicle style (e.g., "Why Interstellar is a Masterpiece", "Underrated Sci-Fi Gem", "Must Watch: [Title]"). Avoid generic labels like "Movie Info".
        2. Description: Max 500 chars (aim for 200-400). Naturally weave in keywords: "Movies to Watch", "Film Recommendation", "Movie Poster", and the genre. Include a hook from the plot but DO NOT just copy the overview. Mention "Filmospere" naturally in a call to action.
        3. Tone: Enthusiastic, helpful, movie-lover to movie-lover.
        4. Output: Return ONLY a valid JSON object: { "title": "...", "description": "..." }
        `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant that outputs JSON." }, { role: "user", content: prompt }],
            model: "gpt-4o", // High quality model as requested
            response_format: { type: "json_object" },
        });

        const content = JSON.parse(completion.choices[0].message.content);
        return {
            title: content.title || getCatchyTitleFallback(movie.title, movie.releaseYear, movie.rating || 0, movie.genres || []),
            description: content.description || getRandomDescriptionFallback(movie)
        };

    } catch (error) {
        console.error(`AI Generation failed for ${movie.title}:`, error.message);
        // Fallback to templates
        return {
            title: getCatchyTitleFallback(movie.title, movie.releaseYear, movie.rating || 0, movie.genres || []),
            description: getRandomDescriptionFallback(movie)
        };
    }
}

function escapeCsv(str) {
    if (!str) return '';
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

async function generateCsv() {
    let history = [];
    if (fs.existsSync(TRACKER_FILE)) {
        history = JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
    }

    const { data: moviesData, error } = await supabase
        .from('movies')
        .select('id, data')
        .order('data->voteCount', { ascending: false })
        .limit(300);

    if (error) {
        console.error('Supabase Error:', error);
        return;
    }

    if (!moviesData) {
        console.error('No data returned from Supabase (moviesData is null)');
        return;
    }

    console.log(`Fetched ${moviesData.length} movies from Supabase.`);

    const movies = moviesData;
    const getTmdbId = (m) => m.data.id?.toString() || m.data.tmdb_id?.toString();

    // Filter history
    const isNew = (m) => {
        const id = getTmdbId(m);
        return id && !history.includes(id);
    };

    let availableTrending = movies.filter(isNew);

    // Split logic
    let trending = availableTrending.filter(m => m.data.voteCount > 2000);
    let gems = availableTrending.filter(m => m.data.rating > 7 && m.data.voteCount <= 2000 && m.data.voteCount > 50);

    let selection = [];
    while (selection.length < 150) {
        if (trending.length >= 2) selection.push(...trending.splice(0, 2));
        else if (trending.length > 0) selection.push(trending.shift());

        if (gems.length >= 3) selection.push(...gems.splice(0, 3));
        else if (gems.length > 0) selection.push(gems.shift());

        if (trending.length === 0 && gems.length === 0) break;
    }

    const finalSelection = selection.slice(0, 150);
    console.log(`Selected ${finalSelection.length} movies for processing.`);

    // Start Date: Jan 21, 2026 (Treating UTC as "Wall Clock IST")
    let currentDate = new Date(Date.UTC(2026, 0, 21));
    let slotIndex = 0; // 0 to 4

    let csvContent = `Title,Description,Link,Image URL,Board Name,Publish Date\n`;
    let processedCount = 0;

    // Use for...of loop to handle async await correctly
    for (let i = 0; i < finalSelection.length; i++) {
        const m = finalSelection[i];
        const d = m.data;
        const tmdbId = getTmdbId(m);

        // Generate Content (AI with Fallback)
        console.log(`Generating content for [${i + 1}/${finalSelection.length}]: ${d.title}...`);
        const { title, description } = await generateAIContent(d);

        // Rate Limiting (200ms delay)
        await delay(200);

        const link = d.slug ? `https://filmospere.com/movie/${d.slug}` : `https://filmospere.com/movie/tmdb-${tmdbId}`;
        const board = BOARD_NAME;

        // Calculate Schedule
        if (i > 0 && i % 5 === 0) {
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            slotIndex = 0;
        }

        const scheduleTime = new Date(currentDate);

        // Schedule Slots (IST Wall Clock):
        if (slotIndex === 0) scheduleTime.setUTCHours(17, 0, 0, 0);
        else if (slotIndex === 1) scheduleTime.setUTCHours(21, 0, 0, 0);
        else if (slotIndex === 2) {
            scheduleTime.setUTCDate(scheduleTime.getUTCDate() + 1);
            scheduleTime.setUTCHours(2, 0, 0, 0);
        }
        else if (slotIndex === 3) {
            scheduleTime.setUTCDate(scheduleTime.getUTCDate() + 1);
            scheduleTime.setUTCHours(6, 0, 0, 0);
        }
        else if (slotIndex === 4) {
            scheduleTime.setUTCDate(scheduleTime.getUTCDate() + 1);
            scheduleTime.setUTCHours(9, 0, 0, 0);
        }
        slotIndex++;

        // Format: YYYY-MM-DDTHH:mm+05:30
        const dateStr = scheduleTime.getUTCFullYear() + '-' +
            String(scheduleTime.getUTCMonth() + 1).padStart(2, '0') + '-' +
            String(scheduleTime.getUTCDate()).padStart(2, '0') + 'T' +
            String(scheduleTime.getUTCHours()).padStart(2, '0') + ':' +
            String(scheduleTime.getUTCMinutes()).padStart(2, '0') + '+05:30';

        let poster = d.posterUrl;
        if (poster && poster.includes('/w780/')) poster = poster.replace('/w780/', '/original/');
        if (poster && poster.includes('/w500/')) poster = poster.replace('/w500/', '/original/');

        if (poster) {
            csvContent += `${escapeCsv(title)},${escapeCsv(description)},${escapeCsv(link)},${escapeCsv(poster)},${escapeCsv(board)},${escapeCsv(dateStr)}\n`;
            if (tmdbId) history.push(tmdbId);
            processedCount++;
        }
    }

    // Write Files
    fs.writeFileSync(CSV_FILE, csvContent);

    const dir = path.dirname(TRACKER_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(history, null, 2));

    console.log(`Successfully generated ${processedCount} pins to pinterest_bulk_upload.csv`);
}

generateCsv();
