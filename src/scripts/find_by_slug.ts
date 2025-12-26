
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Searching by slug...');
    const slugPart = 'balinsasayaw';

    // Supabase filtering on JSONB using filter()
    const { data: rows, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .filter('data->>slug', 'ilike', `%${slugPart}%`);

    if (error) console.error('Error:', JSON.stringify(error, null, 2));

    if (rows && rows.length > 0) {
        console.log('✅ FOUND BY SLUG:');
        rows.forEach(r => console.log(r));
    } else {
        console.log('❌ Not found by slug.');
    }
}

main();
