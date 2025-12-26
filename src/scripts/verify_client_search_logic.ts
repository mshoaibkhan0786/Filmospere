
import fs from 'fs';
import path from 'path';

// 1. Read the dumped article content
const dumpPath = path.resolve(process.cwd(), 'article_dump.txt');
if (!fs.existsSync(dumpPath)) {
    console.error("article_dump.txt not found. Please run dump_article_content.ts first.");
    process.exit(1);
}
const content = fs.readFileSync(dumpPath, 'utf-8');

// 2. Define the exact client-side logic from ArticleService.ts
const getSmartSearchTerm = (title: string) => {
    if (!title) return '';
    let term = title.replace(/^(The|A|An)\s+/i, '');
    term = term.split(/[:\(\)]/)[0];
    return term.trim();
};

const checkMatch = (movieTitle: string) => {
    const searchTerm = getSmartSearchTerm(movieTitle);
    console.log(`[Test] Title: "${movieTitle}" -> Term: "${searchTerm}"`);

    if (!searchTerm) {
        console.log(" -> SKIPPED (Empty term)");
        return;
    }

    const isMatch = content.toLowerCase().includes(searchTerm.toLowerCase());
    console.log(` -> Match Result: ${isMatch ? "SUCCESS" : "FAILURE"}`);

    if (!isMatch) {
        console.log(`    (Content length: ${content.length})`);
        // console.log(`    (Content snippet: ${content.substring(0, 100)}...)`);
    }
};

// 3. Test with the problematic titles
console.log("--- Verifying Client-Side Logic ---");
checkMatch("The Shop Around the Corner");
checkMatch("Sullivan's Travels");
checkMatch("His Girl Friday");
checkMatch("Arsenic and Old Lace");
