
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const checkList = ['Do Patti', 'Dilwale Dulhania Le Jayenge'];

    for (const title of checkList) {
        const { data: movies } = await supabase
            .from('movies')
            .select('*')
            .ilike('title', title)
            .limit(1);

        if (movies && movies.length > 0) {
            const m = movies[0].data;
            const hasWhyWatch = m.whyWatch && m.whyWatch.length > 0;
            const hasMeta = !!m.metaTitle || !!m.metaDescription;

            console.log(`Movie: ${m.title}`);
            console.log(`- Role Correct? ${m.cast.find((c: any) => c.name.includes('Kajol'))?.role}`);
            console.log(`- Has WhyWatch? ${hasWhyWatch ? '✅ YES' : '❌ NO'}`);
            console.log(`- Has Meta Tags? ${hasMeta ? '✅ YES' : '❌ NO'}`);
        }
    }
}

main();

