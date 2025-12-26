
const fs = require('fs');
const content = fs.readFileSync('.env', 'utf8');
const lines = content.split('\n');
lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        const key = line.split('=')[1].trim();
        console.log('KEY_HEX:' + Buffer.from(key).toString('hex'));
    }
});
