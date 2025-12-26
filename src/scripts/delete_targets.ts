
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

const idsToDelete = [
    'tmdb-1266992', // Balinsasayaw
    'tmdb-1266990', // Kulong
    'tmdb-1241742', // EKS
    'tmdb-1241752', // Rita
    'tmdb-1450432', // Arouse
    'tmdb-1476450', // Bayo
    'tmdb-1476453', // Kirot
    'tmdb-1588846', // Ekis
    // 'tmdb-1064213', // Anora (Skipped, might be Sean Baker film)
];

async function main() {
    console.log(`Attempting to delete ${idsToDelete.length} movies...`);

    // Check if they exist first
    const { count } = await supabase.from('movies').select('id', { count: 'exact', head: true }).in('id', idsToDelete);
    console.log(`Found ${count} of them in DB.`);

    // Delete
    const { error } = await supabase.from('movies').delete().in('id', idsToDelete);

    if (error) {
        console.error('❌ Delete Failed:', error.message);
        console.log('You must check your RLS policies or use the SQL query provided.');
    } else {
        console.log('✅ Delete Successful via API!');
    }
}

main();
