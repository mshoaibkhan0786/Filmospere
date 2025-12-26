
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_ACTORS = [
    "Ranbir Kapoor", "Varun Dhawan", "Shah Rukh Khan"
];

async function main() {
    console.log("Checking Live Supabase Data for Sticky Roles (scanning ALL movies)...");

    const PAGE_SIZE = 500; // Safer batch size
    let from = 0;
    let allMovies: any[] = [];
    let fetchMore = true;

    while (fetchMore) {
        console.log(`Fetching rows ${from} to ${from + PAGE_SIZE - 1}...`);
        const { data, error } = await supabase
            .from('movies')
            .select('title, data')
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error("Fetch Error:", error);
            break;
        }

        if (data && data.length > 0) {
            allMovies = [...allMovies, ...data];
            from += PAGE_SIZE;
            if (data.length < PAGE_SIZE) fetchMore = false;
        } else {
            fetchMore = false;
        }
    }

    console.log(`\nFetched Total: ${allMovies.length} movies.`);

    const actorStats: Record<string, Record<string, string[]>> = {};

    allMovies.forEach(m => {
        const cast = m.data.cast || [];
        cast.forEach((c: any) => {
            if (TARGET_ACTORS.includes(c.name)) {
                if (!actorStats[c.name]) actorStats[c.name] = {};
                if (!actorStats[c.name][c.role]) actorStats[c.name][c.role] = [];

                actorStats[c.name][c.role].push(m.title);
            }
        });
    });

    console.log("\n--- REPORT ---");
    let issuesFound = 0;

    Object.entries(actorStats).forEach(([actor, roles]) => {
        Object.entries(roles).forEach(([role, titles]) => {
            if (titles.length > 3) {
                console.log(`❌ ALARM: [${actor}] plays "${role}" in ${titles.length} movies:`);
                console.log(`   Movies: ${titles.slice(0, 5).join(', ')}...`);
                issuesFound++;
            }
        });
    });

    if (issuesFound === 0) {
        console.log("✅ CLEAN! No sticky role clusters found in ENTIRE database.");
    } else {
        console.log(`⚠️  Found ${issuesFound} suspicious clusters.`);
    }
}

main();
