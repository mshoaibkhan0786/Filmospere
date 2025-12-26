import fs from 'fs';
import path from 'path';

const movies = JSON.parse(fs.readFileSync('public/movies.json', 'utf-8'));
const st = movies.find(m => m.id === 'series-stranger-things');

if (st) {
    console.log('FOUND:');
    console.log('ID:', st.id);
    console.log('IsOptimized:', st.isOptimized);
    console.log('Description Start:', st.description?.substring(0, 100));
    console.log('Why Watch:', st.whyWatch);
    console.log('Full Description:', st.description);
} else {
    console.log('Stranger Things NOT FOUND in public/movies.json');
}
