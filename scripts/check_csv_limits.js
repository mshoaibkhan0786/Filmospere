const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, '../pinterest_bulk_upload.csv');

function checkLimits() {
    const content = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = content.split('\n');

    // Headers: Title,Description,Link,Image URL,Board Name,Publish Date
    // We need to handle CSV parsing carefully because descriptions have commas and quotes

    let violations = [];
    let maxTitle = 0;
    let maxDesc = 0;

    // Skip header (index 0) and empty lines
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parser for this specific format
        // We know Description is the 2nd field and wrapped in quotes usually
        // But let's use a regex to capture fields respecting quotes
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

        // Actually, a better way for this specific file structure since we generated it:
        // Title is first, Description is second (quoted), Link is third...

        // Let's use a more robust regex for CSV splitting
        const parts = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);

        if (!parts || parts.length < 2) continue;

        // Clean up parts (remove leading commas)
        const entries = parts.map(p => {
            let val = p.startsWith(',') ? p.slice(1) : p;
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1).replace(/""/g, '"');
            }
            return val;
        });

        const title = entries[0];
        const desc = entries[1];

        if (title.length > 100) {
            violations.push(`Row ${i + 1} Title Limit: ${title.length} chars (Limit 100) - "${title.substring(0, 20)}..."`);
        }
        if (desc.length > 500) {
            violations.push(`Row ${i + 1} Desc Limit: ${desc.length} chars (Limit 500) - "${desc.substring(0, 20)}..."`);
        }

        if (title.length > maxTitle) maxTitle = title.length;
        if (desc.length > maxDesc) maxDesc = desc.length;
    }

    if (violations.length > 0) {
        console.log('VIOLATIONS FOUND:');
        violations.forEach(v => console.log(v));
    } else {
        console.log('✅ All limits passed.');
    }
    console.log(`Max Title Length: ${maxTitle}`);
    console.log(`Max Description Length: ${maxDesc}`);
}

checkLimits();
