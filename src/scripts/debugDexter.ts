
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDexter() {
    console.log('Searching for "Dexter: Resurrection"...');

    // Try searching by title
    const { data: titleData, error: titleError } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%Dexter: Resurrection%');

    if (titleError) {
        console.error('Error fetching by title:', titleError);
    } else {
        const output = `Found ${titleData?.length} matches by title.\n` +
            titleData.map((m, i) => `\n--- Match ${i + 1} ---\nID: ${m.id}\nTitle: ${m.title}\nData: ${JSON.stringify(m.data, null, 2)}`).join('\n');

        fs.writeFileSync(path.join(__dirname, 'debug_output.txt'), output);
        console.log('Output written to debug_output.txt');
    }
}

checkDexter();
