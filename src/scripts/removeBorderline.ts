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

// Reusing this filename to feed into the cleanup script seamlessly
const SUSPECTS_FILE = path.join(__dirname, 'suspected_adult_actors.json');

const TARGETS = [
    'Fifty Shades%',
    '365 Days%',
    'Nymphomaniac%',
    'Love' // special query
];

async function run() {
    console.log('🚀 Starting Borderline Content Removal...');

    let moviesToDelete: any[] = [];

    // 1. Find Movies
    for (const pattern of TARGETS) {
        let query = supabase.from('movies').select('id, title, data');

        if (pattern === 'Love') {
            // Strict match for "Love" by Gaspar Noe usually means title is exactly "Love"
            // Using ilike matching might be too broad for just "Love". 
            // Let's try to match title exact "Love" and maybe check director if possible, or just exact title.
            // But "Love" is a common word. 
            // Let's rely on manual check or strict exact match.
            query = query.eq('title', 'Love');
        } else {
            query = query.ilike('title', pattern);
        }

        const { data, error } = await query;
        if (data && data.length > 0) {
            // Filter "Love" by Gaspar Noe logic if needed?
            // "Love" (2015) is the one.
            if (pattern === 'Love') {
                const gaspar = data.filter(m => m.data.director === 'Gaspar Noé');
                moviesToDelete.push(...gaspar);
            } else {
                moviesToDelete.push(...data);
            }
        }
    }

    // Deduplicate
    moviesToDelete = moviesToDelete.filter((m, index, self) =>
        index === self.findIndex((t) => (
            t.id === m.id
        ))
    );

    console.log(`Found ${moviesToDelete.length} movies to delete:`);
    moviesToDelete.forEach(m => console.log(`- ${m.title} (${m.data.releaseYear})`));

    if (moviesToDelete.length === 0) {
        console.log('No movies found matching targets.');
        return;
    }

    // 2. Collect Cast for Cleanup
    const allCastMembers: any[] = [];
    moviesToDelete.forEach(m => {
        if (m.data.cast) {
            allCastMembers.push(...m.data.cast);
        }
    });

    const castCounts: Record<string, { name: string, count: number }> = {};
    allCastMembers.forEach(c => {
        // Using Name as key for simplicity in cleanup script matching
        if (!castCounts[c.name]) {
            castCounts[c.name] = { name: c.name, count: 0 };
        }
        castCounts[c.name].count++;
    });

    const suspectedActors = Object.values(castCounts);
    // Overwrite the suspects file so the cleanup script picks it up
    fs.writeFileSync(SUSPECTS_FILE, JSON.stringify(suspectedActors, null, 2));
    console.log(`\nSaved ${suspectedActors.length} unique actors from these movies to suspects list.`);


    // 3. Delete Movies
    const idsToDelete = moviesToDelete.map(m => m.id);
    console.log('\nDeleting movies from DB...');

    const { error } = await supabase
        .from('movies')
        .delete()
        .in('id', idsToDelete);

    if (error) {
        console.error('Error deleting movies:', error);
    } else {
        console.log(`✅ Successfully deleted ${idsToDelete.length} movies.`);
    }

    console.log('\nRun "npm run cleanup-cast" (orphans) next.');
}

run().catch(console.error);
