
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const targets = ['Balinsasayaw', 'Kulong', 'Eks', 'Rita', 'Arouse', 'Bayo', 'Ekis', 'Kirot', 'Anor'];

async function main() {
    console.log('Listing movies...');
    const { count, error } = await supabase.from('movies').select('*', { count: 'exact', head: true });
    console.log('Total Count:', count);
    if (error) console.error('Count Error:', error);

    for (const t of targets) {
        // Search by SLUG or Title
        const { data: rows } = await supabase.from('movies')
            .select('id, title, slug, release_date')
            .or(`slug.ilike.%${t}%,title.ilike.%${t}%`);

        if (rows && rows.length > 0) {
            console.log(`✅ MATCH "${t}":`);
            rows.forEach(r => console.log(`   [${r.id}] ${r.title} (Slug: ${r.slug})`));
        } else {
            console.log(`❌ No match for "${t}"`);
        }
    }
}

main();
