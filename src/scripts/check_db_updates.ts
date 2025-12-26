
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkDbUpdates() {
    console.log("Fetching 'updated_at' stats for ALL movies...");

    // Fetch ALL (using pagination to get full count)
    // We only need updated_at, don't fetch heavy data column
    const PAGE_SIZE = 1000;
    let allUpdates: string[] = [];
    let page = 0;

    while (true) {
        const { data, error } = await supabase
            .from('movies')
            .select('updated_at')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error || !data || data.length === 0) break;

        data.forEach(m => {
            if (m.updated_at) allUpdates.push(m.updated_at);
        });

        if (data.length < PAGE_SIZE) break;
        page++;
        process.stdout.write('.');
    }

    console.log(`\nTotal Movies scanned: ${allUpdates.length}`);

    // Group by Date (YYYY-MM-DD)
    const updatesByDate: Record<string, number> = {};
    const updatesLast24Hours: string[] = [];

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    allUpdates.forEach(ts => {
        const date = ts.split('T')[0];
        updatesByDate[date] = (updatesByDate[date] || 0) + 1;

        if (new Date(ts) > yesterday) {
            updatesLast24Hours.push(ts);
        }
    });

    console.log("\n--- Update Activity (Last 5 Days) ---");
    const sortedDates = Object.keys(updatesByDate).sort().reverse().slice(0, 5);
    sortedDates.forEach(date => {
        console.log(`${date}: ${updatesByDate[date]} movies updated`);
    });

    console.log(`\n--- Last 24 Hours Details ---`);
    console.log(`Total Updated Recently: ${updatesLast24Hours.length}`);

    if (updatesLast24Hours.length > 50) {
        console.log("⚠️  WARNING: High number of recent updates detected. Verify if this was intentional.");
    } else {
        console.log("✅ Normal activity detected. No massive batch updates found recently.");
    }
}

checkDbUpdates();
