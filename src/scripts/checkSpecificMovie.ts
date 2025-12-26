
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%Yeh Jawaani Hai Deewani%')
        .limit(1);

    if (error || !data || data.length === 0) {
        console.log('Movie not found or error:', error);
        return;
    }

    const movie = data[0];
    console.log(`Movie: ${movie.title} (${movie.id})`);
    fs.writeFileSync('debug_movie.json', JSON.stringify(movie.data.streamingLinks, null, 2));
    console.log('Wrote streaming links to debug_movie.json');
}

main();
