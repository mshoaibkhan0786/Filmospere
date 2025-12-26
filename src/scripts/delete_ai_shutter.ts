
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    const targetId = '791763d2-c4f7-4b87-a93d-7c802aec2377';
    console.log(`Deleting duplicate article ID: ${targetId}...`);

    const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', targetId);

    if (error) {
        console.error("Delete failed:", error);
    } else {
        console.log("✅ Delete successful.");
    }
}

main();
