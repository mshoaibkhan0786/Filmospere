
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function debugJawan() {
    console.log("Querying 'Jawan' raw JSON...");

    const { data: movies } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', "Jawan");

    if (!movies || movies.length === 0) {
        console.log("Movie 'Jawan' not found.");
        return;
    }

    const m = movies[0];
    const d = m.data;

    console.log("--- DATA STRUCTURE ---");
    console.log(JSON.stringify({
        id: m.id,
        title: m.title,
        description: d.description,
        descriptionType: typeof d.description,
        seoDescription: d.seoDescription,
        seoDescriptionType: typeof d.seoDescription,
        whyWatch: d.whyWatch
    }, null, 2));
}

debugJawan();
