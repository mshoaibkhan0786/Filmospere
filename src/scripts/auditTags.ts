import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching movies...');
    // Fetch all movies (tags only)
    const { data: movies, error } = await supabase
        .from('movies')
        .select('data');

    if (error) {
        console.error(error);
        return;
    }

    const tagCounts: Record<string, number> = {};

    movies.forEach((row: any) => {
        const m = row.data;
        if (m.tags && Array.isArray(m.tags)) {
            m.tags.forEach((t: string) => {
                const tag = t.trim(); // Normalize
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    console.log('Unique Tags:', Object.keys(tagCounts).length);
    // Sort by count
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

    console.log('Top Tags:');
    sorted.slice(0, 50).forEach(([t, c]) => console.log(`${t}: ${c}`));

    // Check specific problematic tags
    console.log('\nAudit Specific (Valid vs Total):');
    ['Adventure', 'Animation', 'Action', 'Comedy'].forEach(cat => {
        const matches = movies.filter((row: any) => {
            const m = row.data;
            return m.tags && Array.isArray(m.tags) && m.tags.includes(cat);
        });
        
        const validMatches = matches.filter((row: any) => {
            const m = row.data;
            const validDuration = !m.duration || m.duration === 'N/A' || parseInt(m.duration) >= 15; // Rough check
            // Actually use exact logic from formatUtils roughly
            const hasPoster = !!m.posterUrl && m.posterUrl !== 'N/A';
            return hasPoster; // Assume duration is usually fine, poster is main suspect
        });

        console.log(`Category "${cat}": Total ${matches.length}, Valid (Poster): ${validMatches.length}`);
    });
}

run();
