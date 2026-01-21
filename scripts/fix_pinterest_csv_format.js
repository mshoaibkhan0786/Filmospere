const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, '../pinterest_bulk_upload.csv');

function fixCsv() {
    let content = fs.readFileSync(CSV_FILE, 'utf8');

    // Split into lines ensuring we handle the multiline descriptions correctly if any (though we fixed them)
    // Actually, simpler to just replace the header line first since it's known.

    const lines = content.split('\n');

    if (lines.length < 2) return;

    // 1. Fix Headers
    // Current: Title,Description,Link,Image URL,Board Name,Publish Date
    // Target: Title,Description,Link,Media URL,Pinterest board,Publish Date

    // Let's verify header
    if (lines[0].includes('Image URL') && lines[0].includes('Board Name')) {
        lines[0] = lines[0].replace('Image URL', 'Media URL').replace('Board Name', 'Pinterest board');
        console.log('Headers updated.');
    } else {
        console.log('Headers already look updated or unknown format.');
    }

    // 2. Fix Dates
    // Format in file: 2026-01-21T17:00+05:30
    // Target: 2026-01-21T11:30:00 (UTC)

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Find the date at the end of the line
        // It matches YYYY-MM-DDTHH:mm+05:30
        const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})\+05:30/);

        if (dateMatch) {
            const istDateStr = dateMatch[0]; // e.g. 2026-01-21T17:00+05:30
            // Parse this string. new Date() handles the offset correctly.
            const dateObj = new Date(istDateStr);

            // Format to UTC string YYYY-MM-DDTHH:mm:ss
            const year = dateObj.getUTCFullYear();
            const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getUTCDate()).padStart(2, '0');
            const hours = String(dateObj.getUTCHours()).padStart(2, '0');
            const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
            const seconds = '00'; // adding seconds as requested

            const utcDateStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

            // Replace in line
            lines[i] = line.replace(istDateStr, utcDateStr);
        }
    }

    // Write back
    fs.writeFileSync(CSV_FILE, lines.join('\n'));
    console.log(`Updated ${lines.length - 1} rows with UTC dates and new headers.`);
}

fixCsv();
