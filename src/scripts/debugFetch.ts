
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugFetch() {
    const slug = 'singham-again-2024';
    console.log(`Fetching slug: ${slug}`);

    const { data, error } = await supabase
        .from('movies')
        .select('id, data')
        .eq('data->>slug', slug)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        const m = data.data;
        console.log('ID:', data.id);
        console.log('Title:', m.title);
        console.log('Slug:', m.slug);
        console.log('Director:', m.director);
        console.log('Description Present:', !!m.description);
        console.log('Description Length:', m.description ? m.description.length : 0);
        console.log('Poster:', m.posterUrl);
        console.log('Year:', m.releaseYear);
        console.log('Backdrop:', m.backdropUrl);
    }
}

debugFetch();
