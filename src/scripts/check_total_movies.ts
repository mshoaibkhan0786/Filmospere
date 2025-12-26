
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkTotalMovies() {
    console.log("Checking Supabase Movie Counts...");

    const { count: totalCount, error: totalError } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true });

    if (totalError) {
        console.error("Error checking total movies:", totalError);
        return;
    }

    const { count: optimizedCount, error: optimizedError } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('data->>isOptimized', 'true');

    if (optimizedError) {
        console.error("Error checking optimized movies:", optimizedError);
        return;
    }

    console.log(`Total Movies in DB: ${totalCount}`);
    console.log(`Optimized Movies in DB: ${optimizedCount}`);

    // Check for "AI DATA" alignment
    // We expect Optimized Movies count to be close to 9988
}

checkTotalMovies();
