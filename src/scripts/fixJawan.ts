
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function fixJawan() {
    // 1. Fetch current data
    const NOTE_TO_FIX = ' Shah Rukh Khan in a dual action-packed role.';
    const CORRECT_NOTE = '👑 Shah Rukh Khan in a dual action-packed role.';

    const { data: movies, error: fetchError } = await supabase
        .from('movies')
        .select('id, data')
        .ilike('title', '%Jawan%');

    if (fetchError || !movies || movies.length === 0) {
        console.error('Error fetching movie:', fetchError);
        return;
    }

    const movie = movies[0]; // Assume first match is correct
    console.log('Fixing movie:', movie.id);

    const whyWatch = movie.data.whyWatch || [];
    const updatedWhyWatch = whyWatch.map((item: string) => {
        if (item.includes('Shah Rukh Khan') && (item.includes('') || item.includes('?'))) {
            return CORRECT_NOTE;
        }
        return item;
    });

    // 2. Update
    const { error: updateError } = await supabase
        .from('movies')
        .update({
            data: { ...movie.data, whyWatch: updatedWhyWatch }
        })
        .eq('id', movie.id);

    if (updateError) {
        console.error('Update failed:', updateError);
    } else {
        console.log('Update success! New whyWatch:', updatedWhyWatch);
    }
}

fixJawan();
