
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    const titles = [
        "The Shop Around the Corner",
        "Sullivan's Travels",
        "His Girl Friday",
        "Arsenic and Old Lace"
    ];

    console.log('Fetching Movie Links...');

    for (const title of titles) {
        const { data: movies, error } = await supabase
            .from('movies')
            .select('id, data')
            .ilike('title', `%${title}%`)
            .limit(1);

        if (movies && movies.length > 0) {
            const m = movies[0];
            const slug = m.data.slug || m.id;
            console.log(`TITLE: ${title} | LINK: /movie/${slug}`);
        } else {
            console.log(`TITLE: ${title} | NOT FOUND`);
        }
    }
}

main();
