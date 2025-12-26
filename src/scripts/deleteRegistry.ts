
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const REGISTRY_ID = 'sys-legacy-cast';

async function deleteRegistry() {
    console.log(`Deleting Cast Registry (${REGISTRY_ID})...`);

    const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', REGISTRY_ID);

    if (error) {
        console.error('Error deleting registry:', error);
    } else {
        console.log('Successfully deleted Cast Registry. Orphaned actors are now gone.');
    }
}

deleteRegistry().catch(console.error);
