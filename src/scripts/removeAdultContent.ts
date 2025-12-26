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

const CANDIDATES_FILE = path.join(__dirname, 'adult_candidates.json');

// EXCEPTIONS PROVIDED BY USER
const EXCEPTIONS_TITLES = [
    "return of xander cage",
    "xXx",
    "18 pages",
    "journey of love 18+",
    "vazhakku enn",
    "metallica: pride, passion and glory",
    "sex education",
    "sex/life",
    "sex tape",
    "blonde",
    "18×2 beyond youthful days",
    "arc de triomphe",
];

async function run() {
    console.log('🚀 Starting Adult Content Removal...');

    if (!fs.existsSync(CANDIDATES_FILE)) {
        console.error('❌ Candidates file not found:', CANDIDATES_FILE);
        return;
    }

    const candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf-8'));
    console.log(`Loaded ${candidates.length} candidates.`);

    // 1. Filter Exceptions
    const toDelete = candidates.filter((m: any) => {
        const lowerTitle = m.title.toLowerCase();
        // Check if title contains any exception string (loose match) or exact match
        const isException = EXCEPTIONS_TITLES.some(ex => lowerTitle.includes(ex.toLowerCase()));
        return !isException;
    });

    console.log(`\nFiltered out ${candidates.length - toDelete.length} exceptions.`);
    console.log(`Proceeding to delete ${toDelete.length} movies.`);

    if (toDelete.length === 0) {
        console.log('No movies to delete.');
        return;
    }

    // 2. Collect Cast Info BEFORE Deletion (for Phase 2)
    // We need to fetch the full movie data for these IDs to get the cast
    const idsToDelete = toDelete.map((m: any) => m.id);
    console.log('\nFetching cast info for analysis...');

    // Chunking for Supabase 'in' query
    const allCastMembers: any[] = [];
    const chunkSize = 50;
    for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        const chunk = idsToDelete.slice(i, i + chunkSize);
        const { data, error } = await supabase
            .from('movies')
            .select('data')
            .in('id', chunk);

        if (data) {
            data.forEach((row: any) => {
                if (row.data.cast) {
                    allCastMembers.push(...row.data.cast);
                }
            });
        }
    }

    // Count Cast Occurrences
    const castCounts: Record<string, { name: string, count: number }> = {};
    allCastMembers.forEach(c => {
        if (!castCounts[c.id]) {
            castCounts[c.id] = { name: c.name, count: 0 };
        }
        castCounts[c.id].count++;
    });

    // 3. Delete Movies
    console.log('\nDeleting movies from DB...');
    // Delete in chunks
    let deletedCount = 0;
    for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        const chunk = idsToDelete.slice(i, i + chunkSize);
        const { error } = await supabase
            .from('movies')
            .delete()
            .in('id', chunk);

        if (error) {
            console.error('Error deleting chunk:', error);
        } else {
            console.log(`Deleted chunk ${i / chunkSize + 1}`);
            deletedCount += chunk.length;
        }
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} movies.`);

    // 4. Save Suspected Adult Actors List
    const suspectedActors = Object.values(castCounts)
        .sort((a, b) => b.count - a.count);

    const actorReportPath = path.join(__dirname, 'suspected_adult_actors.json');
    fs.writeFileSync(actorReportPath, JSON.stringify(suspectedActors, null, 2));

    console.log(`\nSaved ${suspectedActors.length} unique actors found in these deleted movies to:`);
    console.log(actorReportPath);
    console.log('Please review this list to decide which actors to purge globally.');
}

run().catch(console.error);
