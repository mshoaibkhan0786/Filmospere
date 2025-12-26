
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the backup file inside the REPO (as per user request)
const backupPath = path.resolve(__dirname, '../../movies_backup.json');

function main() {
    console.log(`Reading backup file from: ${backupPath}`);

    if (!fs.existsSync(backupPath)) {
        console.error("Backup file not found in Repo!");
        return;
    }

    try {
        const rawData = fs.readFileSync(backupPath, 'utf-8');
        const movies = JSON.parse(rawData);
        console.log(`Loaded ${movies.length} movies.`);

        // Check 1: Zero (SRK)
        // Relaxed search to debug why it was missed
        const zeroCandidates = movies.filter((m: any) => (m.data?.title === 'Zero' || m.title === 'Zero'));
        console.log(`\nFound ${zeroCandidates.length} movies named 'Zero'.`);

        zeroCandidates.forEach((z: any) => {
            const d = z.data || z;
            console.log(` - Zero (${d.releaseYear})`);
        });

        const zero = zeroCandidates.find((z: any) => {
            const d = z.data || z;
            return d.releaseYear == '2018' || d.releaseYear == 2018;
        });

        if (zero) {
            const mData = zero.data || zero;
            const srk = mData.cast?.find((c: any) => c.name.toLowerCase().includes('shah rukh'));
            console.log(`Check 1: Zero (2018) -> SRK Role: "${srk?.role}" [Expected: Bauaa Singh]`);
        } else {
            console.log("Check 1: Zero (2018) NOT found in backup.");
        }

        // Check 2: Do Patti (Kajol)
        const doPatti = movies.find((m: any) => (m.data?.title === 'Do Patti' || m.title === 'Do Patti'));
        if (doPatti) {
            const mData = doPatti.data || doPatti;
            const kajol = mData.cast.find((c: any) => c.name.toLowerCase().includes('kajol'));
            console.log(`Check 2: Do Patti (2024) -> Kajol Role: "${kajol?.role}" [Expected: Vidya Jyothi (VJ)]`);
        } else {
            console.log("Check 2: Do Patti (2024) NOT found.");
        }

        // Check 3: The Gentleman (2025)
        const candidates = movies.filter((m: any) => (m.data?.title === 'The Gentleman' || m.title === 'The Gentleman'));
        console.log(`\nFound ${candidates.length} movies named 'The Gentleman'.`);

        candidates.forEach((z: any) => {
            const d = z.data || z;
            console.log(` - The Gentleman (${d.releaseYear})`);
        });

        const target = candidates.find((z: any) => {
            const d = z.data || z;
            return d.releaseYear == '2025' || d.releaseYear == 2025;
        });

        if (target) {
            const mData = target.data || target;
            console.log(`\n--- Cast for The Gentleman (2025) ---`);
            if (mData.cast && mData.cast.length > 0) {
                mData.cast.slice(0, 10).forEach((c: any) => {
                    console.log(`- ${c.name}: "${c.role}"`);
                });
            } else {
                console.log("No cast found.");
            }
        } else {
            console.log("\nThe Gentleman (2025) NOT found in backup.");
        }

    } catch (e) {
        console.error("Error parsing JSON:", e);
    }
}

main();
