
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspectGoldStandard() {
    try {
        console.log('Fetching a popular movie to analyze schema...');

        // Fetch a known working movie (e.g., highly rated)
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .gt('data->>voteCount', 500) // Ensure it's a popular/valid one
            .limit(1)
            .single();

        if (error) throw error;

        if (!data) {
            console.log('No movies found!');
            return;
        }

        const m = data.data;
        console.log(`\n--- ANALYZING MOVIE: ${m.title} ---`);

        // Check Cast Structure
        if (m.cast && m.cast.length > 0) {
            console.log('\n[CAST SAMPLE]');
            console.log('ID Format:', m.cast[0].id);
            console.log('Image Format:', m.cast[0].imageUrl || m.cast[0].profile_path);
            console.log('Full Object:', JSON.stringify(m.cast[0], null, 2));
        }

        // Check Episode/Season Structure if available (it might be a movie, but schema is shared)
        if (m.seasons && m.seasons.length > 0) {
            console.log('\n[SEASON SAMPLE]');
            console.log(JSON.stringify(m.seasons[0], null, 2));
        }

        // Check General Image Fields
        console.log('\n[GENERAL IMAGES]');
        console.log('Poster:', m.posterUrl);
        console.log('Backdrop:', m.backdropUrl);
        console.log('Images Array:', m.images ? m.images[0] : 'None');

    } catch (e) {
        console.error('Error:', e);
    }
}

inspectGoldStandard();
