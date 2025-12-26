
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    const title = "The Shop Around the Corner";
    console.log(`Checking data for: ${title}`);

    const { data: current, error } = await supabase
        .from('movies')
        .select('data')
        .eq('title', title)
        .single();

    if (error) {
        console.error("Error fetching movie:", error);
        return;
    }

    if (current && current.data) {
        console.log("--- RAW DATA DUMP ---");
        console.log("description:", current.data.description);
        console.log("metaDescription:", current.data.metaDescription);
        console.log("seoDescription:", current.data.seoDescription);
        console.log("---------------------");
    } else {
        console.log("Movie not found or data is null");
    }
}

main();
