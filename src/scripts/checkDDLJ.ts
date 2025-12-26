
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public/movies.json');
const raw = fs.readFileSync(filePath, 'utf-8');
const movies = JSON.parse(raw);

const ddljs = movies.filter((m: any) => m.title.includes('Dulhania'));

console.log(`Found ${ddljs.length} matches:`);
ddljs.forEach((m: any) => {
    console.log(`- ${m.title} (ID: ${m.id}) HasWhyWatch: ${!!m.whyWatch}`);
});
