const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tuspzqzahnlukliyqjbd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c3B6cXphaG5sdWtsaXlxamJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDIzMTksImV4cCI6MjA4MTIxODMxOX0.frkgaCFseKrDPUprm3OT0m75PzZ9yk-yrgSC9XUifWU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Fetching Money Heist data by Title...');

    // 1. Try by Title (should be faster if indexed)
    const { data: titleData, error: titleError } = await supabase
        .from('movies')
        .select('*')
        .eq('title', 'Money Heist') // Top level column
        .single();

    if (titleError) {
        console.error('Error fetching by title:', titleError);
    }

    if (titleData) {
        console.log('Found by title:', titleData.id);
        const movie = titleData.data;
        if (movie) {
            console.log('Title:', movie.title);
            console.log('Seasons Count:', movie.seasons ? movie.seasons.length : 'N/A');
            if (movie.seasons && movie.seasons.length > 0) {
                console.log('First Season Sample:', JSON.stringify(movie.seasons[0], null, 2));
            } else {
                console.log('Seasons array is empty or missing.');
            }
        }
    } else {
        console.log('Not found by title "Money Heist"');
    }
}

main();
