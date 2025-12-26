
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // or SERVICE_ROLE if available, but ANON usually works if RLS allows or we use SERVICE

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_MOVIES_PHRASES = [
    'Pleasure Spa',
    'Fifty Shades of Grey',
    'Fifty Shades Darker',
    'Fifty Shades Freed',
    '365 Days' // Will match "365 Days", "365 Days: This Day", "The Next 365 Days" via ilike
];

async function purgeContent() {
    console.log('Starting content purge...');

    // 1. Find the movies
    let allTargets: any[] = [];

    for (const phrase of TARGET_MOVIES_PHRASES) {
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .ilike('title', `%${phrase}%`);

        if (error) {
            console.error(`Error searching for ${phrase}:`, error);
            continue;
        }
        if (data) {
            console.log(`Found ${data.length} matches for "${phrase}"`);
            allTargets = [...allTargets, ...data];
        }
    }

    // Deduplicate by ID
    const uniqueTargets = Array.from(new Map(allTargets.map(m => [m.id, m])).values());

    if (uniqueTargets.length === 0) {
        console.log('No matching movies found to delete.');
        return;
    }

    console.log(`Identify ${uniqueTargets.length} unique movies to delete:`);
    uniqueTargets.forEach(m => console.log(` - ${m.title} (${m.id})`));

    // 2. Extract Cast
    const castRegistry = new Map();
    uniqueTargets.forEach(m => {
        const movieData = m.data || m; // Handle raw row vs data column if mapped
        // MovieContext maps row.data -> Movie, but here we did select *
        // In local check I see 'data' column usage.

        // Check structure: usually 'data' column holds the JSON
        const source = m.data ? m.data : m;

        if (source.cast && Array.isArray(source.cast)) {
            source.cast.forEach((c: any) => {
                if (!castRegistry.has(c.id)) {
                    castRegistry.set(c.id, c);
                }
            });
        }
    });

    const allCast = Array.from(castRegistry.values());
    console.log(`Found ${allCast.length} unique cast members to preserve.`);

    // 3. Create/Update System Registry
    if (allCast.length > 0) {
        console.log('Upserting System: Cast Registry...');
        const registryId = 'sys-legacy-cast';

        // Fetch existing logic to merge? No, let's just overwrite or Ensure we don't lose previous ones if we run this script info
        // actually, let's just make it a big bucket.

        const registryMovie = {
            id: registryId,
            title: 'System: Cast Registry',
            releaseYear: 1900,
            description: 'Hidden system record to preserve cast members from deleted content.',
            posterUrl: '',
            cast: allCast,
            tags: ['System'],
            hiddenTags: ['System'], // Ensure it's hidden
            rating: 0,
            voteCount: 0,
            views: 0,
            streamingLinks: [],
            isCopyrightFree: false,
            duration: '0m',
            director: 'System'
        };

        const { error: upsertError } = await supabase
            .from('movies')
            .upsert({
                id: registryId,
                title: registryMovie.title,
                data: registryMovie,
                updated_at: new Date().toISOString()
            });

        if (upsertError) {
            console.error('Failed to create Cast Registry! Aborting deletion to be safe.', upsertError);
            return;
        }
        console.log('Successfully safeguarded actors.');
    }

    // 4. Delete Movies
    const idsToDelete = uniqueTargets.map(m => m.id);
    const { error: deleteError } = await supabase
        .from('movies')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error('Error deleting movies:', deleteError);
    } else {
        console.log(`Successfully deleted ${idsToDelete.length} movies.`);
    }
}

purgeContent().catch(console.error);
