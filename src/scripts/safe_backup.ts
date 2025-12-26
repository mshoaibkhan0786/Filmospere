
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Adjust env path if necessary
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Or SERVICE_KEY if needed for RLS bypass

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Target Directory: C:\WEB DEV\Filmospere\Filmospere DB
// This resolves to a sibling of "Filmospere Repo"
// We use path.resolve from src/scripts/../../.. to get to the parent of the repo
const TARGET_DIR = path.resolve(__dirname, '../../../Filmospere DB');
// Fallback if that fails/is blocked: src/backups
const FALLBACK_DIR = path.resolve(__dirname, '../../backups');

function getTimestamp() {
    const now = new Date();
    // Indian Time Zone, DD-MM-YYYY format
    // output example: 25-12-2025_15-30-00
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    // Format parts
    const formatter = new Intl.DateTimeFormat('en-IN', options);
    const parts = formatter.formatToParts(now);

    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    const second = parts.find(p => p.type === 'second')?.value;

    return `${day}-${month}-${year}_${hour}-${minute}-${second}`;
}

async function backupTable(tableName: string, dir: string) {
    console.log(`\n📦 Backing up table: '${tableName}'...`);
    let allRows: any[] = [];
    let page = 0;
    const pageSize = 100; // Reduced from 1000 to avoid statement timeout

    // Pagination loop
    while (true) {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error(`❌ Error fetching ${tableName}:`, error.message);
            return false;
        }

        if (!data || data.length === 0) break;
        allRows = allRows.concat(data);
        process.stdout.write('.'); // progress indicator

        if (data.length < pageSize) break;
        page++;
    }

    console.log(`\n✅ Fetched ${allRows.length} rows.`);

    const timestamp = getTimestamp();
    const filename = `${tableName}_backup_${timestamp}.json`;
    const filePath = path.join(dir, filename);

    try {
        fs.writeFileSync(filePath, JSON.stringify(allRows, null, 2));
        console.log(`💾 Saved to: ${filePath}`);
        return true;
    } catch (err: any) {
        console.error(`❌ Failed to write file: ${err.message}`);
        return false;
    }
}

async function main() {
    console.log("🛡️ Starting SAFE Backup...");

    // Argument Parsing
    const args = process.argv.slice(2);
    const backupMovies = args.includes('--movies') || (!args.includes('--articles'));
    const backupArticles = args.includes('--articles') || (!args.includes('--movies'));

    let baseDir = TARGET_DIR;
    // Check access to base target
    if (!fs.existsSync(baseDir)) {
        try {
            fs.mkdirSync(baseDir, { recursive: true });
        } catch (e) {
            console.warn(`⚠️ Could not access ${baseDir}. Switching to fallback: ${FALLBACK_DIR}`);
            baseDir = FALLBACK_DIR;
        }
    }

    // Define Specific Subfolders
    const moviesDir = path.join(baseDir, 'Movies Backup');
    const articlesDir = path.join(baseDir, 'Articles Backup');

    // Create Subfolders
    if (backupMovies && !fs.existsSync(moviesDir)) fs.mkdirSync(moviesDir, { recursive: true });
    if (backupArticles && !fs.existsSync(articlesDir)) fs.mkdirSync(articlesDir, { recursive: true });

    console.log(`📂 Base Directory: ${baseDir}`);

    if (backupMovies) {
        console.log(`🎬 Target: Movies -> ${moviesDir}`);
        await backupTable('movies', moviesDir);
    } else {
        console.log("⏭️ Skipping Movies (not requested).");
    }

    if (backupArticles) {
        console.log(`📰 Target: Articles -> ${articlesDir}`);
        await backupTable('articles', articlesDir);
    } else {
        console.log("⏭️ Skipping Articles (not requested).");
    }

    console.log("\n🎉 Backup Cycle Complete.");
}

main();
