
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Setup Supabase
const supabase = createClient(
    "https://tuspzqzahnlukliyqjbd.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c3B6cXphaG5sdWtsaXlxamJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDIzMTksImV4cCI6MjA4MTIxODMxOX0.frkgaCFseKrDPUprm3OT0m75PzZ9yk-yrgSC9XUifWU"
);

const OPENAI_KEY = "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";

const OUTPUT_FILE = path.join(__dirname, '../pinterest_next_30_days.csv');
const OLD_FILE = path.join(__dirname, '../pinterest_bulk_upload.csv');

// Config
const DAILY_POSTS = 5;
const DAYS_TO_GENERATE = 30;
const START_DATE = new Date('2026-02-21'); // Starting after Feb 20

// OpenAI Helper (Raw Fetch to avoid dependency issues)
async function generateAIContent(movie) {
    const prompt = `
    Create catchy, viral Pinterest content for the movie "${movie.title}" (${movie.releaseYear || ''}).
    Genres: ${movie.tags ? movie.tags.join(', ') : 'Movie'}.
    
    1. Title: Short, clickbait-style (max 80 chars). No quotes.
    2. Description: Engaging, asking a question or teasing the plot (max 400 chars). ending with generic hashtags like #movies #whattowatch.
    
    Format: JSON { "title": "...", "description": "..." }
    `;

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        const data = await res.json();
        if (!data.choices) {
            console.error("OpenAI Error:", JSON.stringify(data));
            return null;
        }

        const content = data.choices[0].message.content;
        // Clean JSON formatting
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);

    } catch (e) {
        console.error(`AI Gen failed for ${movie.title}:`, e.message);
        return {
            title: `Must Watch: ${movie.title}`,
            description: `Check out ${movie.title}! One of the best movies to watch. #movies`
        };
    }
}

async function main() {
    console.log("🚀 Starting Pinterest Content Generation...");

    // 1. Read Used Movies
    let existingContent = '';
    const usedTitles = new Set();
    if (fs.existsSync(OLD_FILE)) {
        existingContent = fs.readFileSync(OLD_FILE, 'utf-8');
        const lines = existingContent.split('\n');
        lines.forEach(l => {
            const parts = l.split(',');
            // Rough check for title (usually 1st column)
            if (parts[0]) usedTitles.add(parts[0].toLowerCase().trim());
        });
    }
    console.log(`ℹ️  Found ${usedTitles.size} already scheduled movies.`);

    // 2. Fetch Candidates
    // Get high rated, popular movies
    const { data: movies, error } = await supabase
        .from('movies')
        .select('data')
        .gt('data->voteCount', 200) // Popular enough
        .gt('data->rating', 6)     // Good quality
        .limit(500); // Fetch extra to filter

    if (error) {
        console.error("Supabase Error:", JSON.stringify(error, null, 2));
        return;
    }

    // Filter used
    const candidates = movies
        .map(m => m.data)
        .filter(m => {
            if (!m.title || !m.posterUrl) return false;
            // Check title uniqueness
            if (usedTitles.has(m.title.toLowerCase().trim())) return false;
            // Check for valid image
            if (m.posterUrl === 'N/A' || !m.posterUrl.startsWith('http')) return false;
            return true;
        })
        .slice(0, DAILY_POSTS * DAYS_TO_GENERATE);

    console.log(`✅ Selected ${candidates.length} distinct movies for generation.`);

    // 3. Generate CSV
    let csvContent = "Title,Description,Link,Image URL,Board,Date\n";
    let currentDate = new Date(START_DATE);
    const slots = [
        { h: 2, m: 30, ampm: 'AM' },
        { h: 6, m: 30, ampm: 'AM' },
        { h: 9, m: 30, ampm: 'AM' },
        { h: 5, m: 30, ampm: 'PM' },
        { h: 9, m: 30, ampm: 'PM' }
    ];

    let count = 0;

    // Process in batches to respect rate limits? Sequential is checking constraints.
    for (let i = 0; i < candidates.length; i++) {
        const movie = candidates[i];

        console.log(`[${i + 1}/${candidates.length}] Generating for: ${movie.title}...`);

        const aiData = await generateAIContent(movie);
        if (!aiData) continue;

        // Schedule Logic
        const slot = slots[i % 5];
        if (i > 0 && i % 5 === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Format Date: YYYY-MM-DDTHH:mm:ss for internal use, usually user wants local? 
        // But script uses MM/DD/YYYY from CSV?
        // Wait, current script ignores Date column for 'today' logic, but user might want these for reference
        // Let's format nicely.
        // Actually, the previous CSV format was: Title,Description,Link,Image,Board,Date?
        // Let's adhere to standard CSV rules (escape quotes).

        const escapeCsv = (txt) => {
            if (!txt) return '';
            return `"${txt.replace(/"/g, '""')}"`;
        };

        const title = escapeCsv(aiData.title);
        const desc = escapeCsv(aiData.description);
        const link = `https://filmospere.com/movie/${(movie.slug || movie.id).replace(/\s+/g, '-')}`;
        const img = movie.posterUrl;
        const board = "Best Movies to Watch"; // or switch based on genre?

        // Date String for user reference: YYYY-MM-DDTHH:mm...
        // Actually, the current auto_scheduler calculates dynamically.
        // But having it in CSV is good for record.
        const isoDate = currentDate.toISOString().split('T')[0];
        const dateStr = `${isoDate}T${slot.h}:${slot.m}:00`;

        csvContent += `${title},${desc},${link},${img},${board},${dateStr}\n`;
        count++;
    }

    fs.writeFileSync(OUTPUT_FILE, csvContent);
    console.log(`🎉 Generation Complete! Saved ${count} pins to ${OUTPUT_FILE}`);
}

main();
