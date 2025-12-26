
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function dump() {
    const { data: record } = await supabase
        .from('movies')
        .select('data')
        .eq('id', 'tmdb-79352')
        .single();

    if (record) {
        const outputPath = path.resolve(process.cwd(), 'sacred_games_final.json');
        fs.writeFileSync(outputPath, JSON.stringify(record.data, null, 2));
        console.log(`Saved to ${outputPath}`);
    }
}

dump();
