const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../pinterest_bulk_upload.csv');
const OUTPUT_DIR = path.join(__dirname, '../pinterest_daily_batches');

function splitCsv() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const content = fs.readFileSync(SOURCE_FILE, 'utf8');
    const lines = content.trim().split('\n');

    // Header: Title,Description,Link,Media URL,Pinterest board,Publish Date
    const header = lines[0];

    // Map to group by date (YYYY-MM-DD)
    const batches = {};

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Extract date. Format: ... ,2026-01-21T11:30:00
        const dateMatch = line.match(/,(\d{4}-\d{2}-\d{2})T/);

        if (dateMatch) {
            const dateKey = dateMatch[1]; // 2026-01-21
            if (!batches[dateKey]) {
                batches[dateKey] = [];
            }
            batches[dateKey].push(line);
        } else {
            // Fallback for lines without date? Should not happen if confirmed.
            console.warn('Could not parse date for line:', line.substring(0, 50) + '...');
        }
    }

    // Write files
    let fileCount = 0;
    Object.keys(batches).forEach(date => {
        const filename = path.join(OUTPUT_DIR, `pinterest_${date}.csv`);
        const fileContent = [header, ...batches[date]].join('\n');
        fs.writeFileSync(filename, fileContent);
        fileCount++;
        console.log(`Created ${filename} (${batches[date].length} pins)`);
    });

    console.log(`\nSuccessfully created ${fileCount} daily CSV files in ${OUTPUT_DIR}`);
}

splitCsv();
