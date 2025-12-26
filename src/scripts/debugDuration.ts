import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('movies')
        .select('data')
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    data.forEach((row: any) => {
        const m = row.data;
        console.log(`Title: ${m.title}, Duration: "${m.duration}" (Type: ${typeof m.duration})`);
    });
}

main();
