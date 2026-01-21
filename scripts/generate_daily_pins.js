
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TRACKER_FILE = path.join(__dirname, '../.agent/pinterest_tracker.json');
const OUTPUT_FILE = path.join(__dirname, '../pinterest_output.md');

// Number of days to generate (default 1, pass as arg 1)
const DAYS_TO_GENERATE = parseInt(process.argv[2]) || 1;
// Start Date Offset (default: start from today. If generating bulk, logic handles increment)
// You can adjust this manually if you want to start from a specific future date.
const START_DATE = new Date();
START_DATE.setDate(START_DATE.getDate() + 2); // Start from Jan 22 (since 20/21 are done)

// Map TMDB Genres to Pinterest Interests/Keywords
function getPinterestInterests(genres) {
    const map = {
        'Action': ['Action Movies', 'Adrenaline', 'Hero Aesthetic'],
        'Adventure': ['Travel Aesthetic', 'Adventure Time', 'Wanderlust'],
        'Animation': ['Character Design', 'Animation Art', 'Disney Aesthetic'],
        'Comedy': ['Funny Quotes', 'Good Vibes', 'Feel Good'],
        'Crime': ['Crime Thriller', 'Detective Aesthetic', 'Noir'],
        'Documentary': ['History Facts', 'Real Stories', 'Knowledge'],
        'Drama': ['Cinema Aesthetic', 'Movie Quotes', 'Emotional'],
        'Family': ['Family Night', 'Kids Movies', 'Wholesome'],
        'Fantasy': ['Fantasy Art', 'Magical', 'World Building'],
        'History': ['Vintage Aesthetic', 'Historical Facts', 'Period Drama'],
        'Horror': ['Dark Art', 'Horror Movies', 'Spooky Aesthetic'],
        'Music': ['Music Vibes', 'Concert Photography', 'Band Aesthetic'],
        'Mystery': ['Mystery Aesthetic', 'Plot Twist', 'Detective'],
        'Romance': ['Couple Goals', 'Love Quotes', 'Romantic Aesthetic'],
        'Science Fiction': ['Sci Fi Art', 'Futuristic', 'Space Aesthetic'],
        'TV Movie': ['Cozy Vibes', 'Movie Night'],
        'Thriller': ['Suspense', 'Psychological Thriller', 'Dark Aesthetic'],
        'War': ['History', 'Military Aesthetic'],
        'Western': ['Cowboy Aesthetic', 'Wild West', 'Vintage']
    };

    let interests = [];
    const g1 = genres[0];
    if (g1 && map[g1]) interests.push(...map[g1]);

    const g2 = genres[1];
    if (g2 && map[g2]) interests.push(map[g2][0]);

    if (interests.length === 0) interests = ['Movie Aesthetic', 'Cinema', 'Pop Culture'];

    return interests.slice(0, 5);
}

function cleanTag(tag) {
    if (!tag) return '';
    return tag.replace(/[^a-zA-Z0-9]/g, '');
}

// Generate High-CTR, Pinterest-Safe Titles
function getCatchyTitle(title, year, rating, genres) {
    const genre = genres[0] || 'Movie';
    const templates = [
        `Best ${genre} Movies You Need to Watch: ${title} 🍿`,
        `${title} (${year}) - Movie Review & Details ⭐`,
        `Why ${title} is a Cinematic Masterpiece 🎬`,
        `Underrated Gems: ${title} (${year}) 💎`,
        `${title} - Cast, Plot & Streaming Info 🎥`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

async function generatePins() {
    let history = [];
    if (fs.existsSync(TRACKER_FILE)) {
        history = JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
    }

    // Fetch Candidates (Increased limits for bulk)
    // We need 5 * 30 = 150 movies. 
    // Mix is 2 Trending (60 total) + 3 Gems (90 total).
    // Fetching extra to safe.
    const { data: trending, error: err1 } = await supabase
        .from('movies')
        .select('id, data')
        .order('data->voteCount', { ascending: false })
        .limit(300);

    const { data: gems, error: err2 } = await supabase
        .from('movies')
        .select('id, data')
        .gt('data->rating', 7)
        .lt('data->voteCount', 2000)
        .gt('data->voteCount', 50)
        .limit(400);

    if (err1 || err2) {
        console.error('Supabase Error:', err1 || err2);
        return;
    }

    const getTmdbId = (m) => m.data.id?.toString() || m.data.tmdb_id?.toString();

    const isNew = (m) => {
        const id = getTmdbId(m);
        return id && !history.includes(id);
    };

    let availableTrending = trending.filter(isNew);
    let availableGems = gems.filter(isNew);
    let fullContent = '';

    for (let day = 0; day < DAYS_TO_GENERATE; day++) {
        // Current Date for this Batch
        const date = new Date(START_DATE);
        date.setDate(START_DATE.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];

        // Select 2 Trending + 3 Gems
        const selection = [];
        const dayTrend = availableTrending.slice(0, 2);
        selection.push(...dayTrend);
        // Remove used from pool
        availableTrending = availableTrending.slice(2);

        const dayGems = availableGems.slice(0, 3);
        selection.push(...dayGems);
        availableGems = availableGems.slice(3);

        // Fill if short
        while (selection.length < 5 && availableTrending.length > 0) {
            const next = availableTrending.shift();
            selection.push(next);
        }

        const uniqueSelection = selection.slice(0, 5);

        if (uniqueSelection.length < 5) {
            console.log(`Warning: Ran out of movies on Day ${day + 1}!`);
            break;
        }

        fullContent += `\n# 📅 SCHEDULE FOR: ${dateStr}\n`;
        fullContent += `*Global Strategy: 5:00 PM IST start*\n\n---\n`;

        uniqueSelection.forEach((m, i) => {
            const d = m.data;
            const tmdbId = getTmdbId(m);

            // Pinterest Topics
            const topics = getPinterestInterests(d.genres || []);
            const topicString = topics.join(', ');

            const tags = (d.genres || []).concat(d.keywords || []).slice(0, 3)
                .map(t => '#' + cleanTag(t)).join(' ');

            const isGem = Number(d.voteCount) < 2000;
            const extraTag = isGem ? '#HiddenGem #Underrated' : '#MustWatch #Trending';

            let poster = d.posterUrl;
            if (poster && poster.includes('/w780/')) poster = poster.replace('/w780/', '/original/');
            if (poster && poster.includes('/w500/')) poster = poster.replace('/w500/', '/original/');

            const pinTitle = getCatchyTitle(d.title, d.releaseYear, d.rating, d.genres || []);
            const link = d.slug ? `https://filmospere.com/movie/${d.slug}` : `https://filmospere.com/movie/tmdb-${tmdbId}`;

            // Ensure Clean Spacing
            fullContent += `\n### ${i + 1}. ${d.title}\n\n`;
            fullContent += `**Image:**\n[Download High-Res Poster](${poster})\n\n`;
            fullContent += `**Title:**\n${pinTitle}\n\n`;
            fullContent += `**Description:**\n${d.overview ? d.overview.substring(0, 150) + '...' : 'Watch this amazing movie.'}\n\n`;
            fullContent += `**Pinterest Topics:**\n${topicString}\n\n`;
            fullContent += `**Link:**\n${link}\n\n`;

            if (tmdbId) history.push(tmdbId);
        });

        fullContent += '---\n';
    }

    fs.writeFileSync(OUTPUT_FILE, fullContent);

    const dir = path.dirname(TRACKER_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(history, null, 2));

    console.log(`Generated ${DAYS_TO_GENERATE} days of content to pinterest_output.md`);
}

generatePins();
