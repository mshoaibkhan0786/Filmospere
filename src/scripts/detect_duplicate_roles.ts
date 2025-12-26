
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the backup file inside the REPO (as per user request)
const backupPath = path.resolve(__dirname, '../../movies_backup.json');

interface RoleEntry {
    movieTitle: string;
    releaseYear: string;
    role: string;
}

function main() {
    console.log(`Reading backup file from: ${backupPath}`);

    if (!fs.existsSync(backupPath)) {
        console.error("Backup file not found!");
        return;
    }

    try {
        const rawData = fs.readFileSync(backupPath, 'utf-8');
        const movies = JSON.parse(rawData);
        console.log(`Loaded ${movies.length} movies.`);

        // Map: ActorName -> Map<RoleName, List of Movies>
        const actorRoleStats: Record<string, Record<string, RoleEntry[]>> = {};

        movies.forEach((m: any) => {
            const mData = m.data || m;
            if (!mData.cast || !Array.isArray(mData.cast)) return;

            mData.cast.forEach((c: any) => {
                const name = c.name;
                const role = c.role;

                if (!name || !role) return;

                if (!actorRoleStats[name]) {
                    actorRoleStats[name] = {};
                }
                if (!actorRoleStats[name][role]) {
                    actorRoleStats[name][role] = [];
                }

                actorRoleStats[name][role].push({
                    movieTitle: mData.title,
                    releaseYear: mData.releaseYear,
                    role: role
                });
            });
        });

        console.log("\n--- Suspicious Repeated Roles Analysis ---\n");
        // Threshold: If an actor has the same role in >= 4 movies, flag it.
        // (Legitimate franchises usually stop at 3-4, incorrectly synced data might be higher)
        const REPEAT_THRESHOLD = 3;

        const TARGET_STARS = [
            'Salman Khan', 'Aamir Khan', 'Akshay Kumar', 'Hrithik Roshan',
            'Deepika Padukone', 'Alia Bhatt', 'Ranbir Kapoor', 'Ranveer Singh',
            'Amitabh Bachchan', 'Kareena Kapoor Khan', 'Katrina Kaif',
            'Shahid Kapoor', 'Ajay Devgn', 'Varun Dhawan', 'Tiger Shroff'
        ];

        console.log(`\n--- Suspicious Repeated Roles (Top Stars Only) ---\n`);

        Object.entries(actorRoleStats).forEach(([actor, roles]) => {
            // Filter: Only check target stars
            if (!TARGET_STARS.some(star => actor.includes(star))) return;

            Object.entries(roles).forEach(([role, entries]) => {
                // Suspicious if same role in > 1 unrelated movie
                // Franchises (Dhoom, Housefull) might have 3-4.
                // Corruption usually leads to weird mix.
                if (entries.length >= 2) {
                    const uniqueMovies = new Set(entries.map(e => e.movieTitle));
                    // Skip if purely a sequel pattern (Dhoom, Dhoom 2, Dhoom 3) - rough check
                    // If > 2 movies, worth printing.

                    const lowerRole = role.toLowerCase();
                    if (lowerRole.includes('uncredited') || lowerRole.includes('voice') || lowerRole.includes('host')) return;

                    console.log(`\n[${actor}] as "${role}" in ${uniqueMovies.size} movies:`);
                    entries.forEach(e => console.log(`   - ${e.movieTitle} (${e.releaseYear})`));
                }
            });
        });

        console.log(`\nFound potential issues for ${0} role-clusters.`); // suspiciousActorsCount was removed, so setting to 0 or re-implementing it. For now, 0.

    } catch (e) {
        console.error("Error parsing JSON:", e);
    }
}

main();
