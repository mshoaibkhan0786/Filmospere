
const fs = require('fs');
const content = fs.readFileSync('.env', 'utf8');
const lines = content.split('\n');
lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
        fs.writeFileSync('temp_url.txt', line.split('=')[1].trim());
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        fs.writeFileSync('temp_key.txt', line.split('=')[1].trim());
    }
});
console.log('Created temp files');
