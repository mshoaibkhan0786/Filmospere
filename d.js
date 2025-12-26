
const fs = require('fs');
const content = fs.readFileSync('.env', 'utf8');
const lines = content.split('\n');
lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) console.log('URL:' + line.split('=')[1]);
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) console.log('KEY:' + line.split('=')[1]);
});
