import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY || '8da2d8399f3af98c4d290b2aaacc602e';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchInternal(url: string) {
    const fullUrl = new URL(url);
    fullUrl.searchParams.append('api_key', TMDB_API_KEY);
    const res = await fetch(fullUrl.toString());
    if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
    return res.json();
}

async function repairHaikyuu() {
    console.log('Fetching Haikyu!! data from TMDB (60863)...');

    try {
        const details = await fetchInternal('https://api.themoviedb.org/3/tv/60863?append_to_response=credits');
        // console.log('TMDB Response check:', JSON.stringify(details.created_by, null, 2));

        let creator = 'Unknown';

        // Strategy 1: created_by (Showrunners)
        if (details.created_by && details.created_by.length > 0) {
            creator = details.created_by.map((c: any) => c.name).join(', ');
        }
        // Strategy 2: Credits Crew (Mangaka/Author)
        else if (details.credits && details.credits.crew) {
            const crew = details.credits.crew;
            // Log crew to find the right job title
            const candidates = crew.filter((c: any) => ['Author', 'Original Series Creator', 'Writer', 'Original Concept', 'Series Composition'].includes(c.job));
            console.log('Creator Candidates:', candidates.map((c: any) => `${c.name} (${c.job})`));

            if (candidates.length > 0) {
                // Prioritize Author/Creator
                const best = candidates.find((c: any) => c.job === 'Original Series Creator' || c.job === 'Author') || candidates[0];
                creator = best.name;
            }
        }

        console.log('Found Creator:', creator);

        // Fetch current DB row to merge
        const { data: current, error: fetchError } = await supabase
            .from('movies')
            .select('*')
            .eq('id', 'tmdb-60863')
            .single();

        if (fetchError || !current) {
            console.error('Could not find Haikyuu in DB');
            return;
        }

        const newData = {
            ...current.data,
            creator: creator
        };

        // Update
        const { error: updateError } = await supabase
            .from('movies')
            .update({ data: newData })
            .eq('id', 'tmdb-60863');

        if (updateError) {
            console.error('Update failed:', updateError);
        } else {
            console.log('Successfully updated Haikyuu with creator:', creator);
        }

    } catch (err) {
        console.error('Script failed:', err);
    }
}

repairHaikyuu();
