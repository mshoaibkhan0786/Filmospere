
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public/movies.json');
if (!fs.existsSync(filePath)) {
    console.log('public/movies.json not found');
    process.exit(0);
}

const raw = fs.readFileSync(filePath, 'utf-8');
const movies = JSON.parse(raw);

const optimized = movies.filter((m: any) => m.whyWatch && m.whyWatch.length > 0);

console.log(`Public Movies Total: ${movies.length}`);
console.log(`Optimized in Public: ${optimized.length}`);

if (optimized.length > 0) {
    console.log('Sample WhyWatch:', optimized[0].whyWatch);
}
