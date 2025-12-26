import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Standard env load
import path from 'path';
import { fileURLToPath } from 'url';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use Service Key for writes

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? 'Has Value' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey.trim(), {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

async function migratePeople() {
    console.log('Fetching movies...');
    // Fetch all movies (limit 2000 just in case)
    const { data: movies, error } = await supabase
        .from('movies')
        .select('data')
        .limit(2000);

    if (error || !movies) {
        console.error('Error fetching movies:', error);
        return;
    }

    console.log(`Successfully fetched ${movies.length} movies.`);
    console.log('Sample movie data keys:', movies.length > 0 ? Object.keys(movies[0]) : 'None');

    const castMap = new Map<string, any>();
    const directorMap = new Map<string, any>();

    movies.forEach(row => {
        const m = row.data;

        // 1. Process Cast
        if (m.cast && Array.isArray(m.cast)) {
            m.cast.forEach((c: any) => {
                // Use TMDB ID as primary key if available, else Name
                const key = c.id ? `id:${c.id}` : `name:${c.name}`;

                // Keep the one with more info (e.g. image_url)
                if (!castMap.has(key)) {
                    castMap.set(key, {
                        tmdb_id: c.id ? c.id.toString() : null,
                        name: c.name,
                        image_url: c.imageUrl || c.profile_path || null
                    });
                } else {
                    // Update if existing entry lacks image but this one has it
                    const existing = castMap.get(key);
                    if (!existing.image_url && (c.imageUrl || c.profile_path)) {
                        existing.image_url = c.imageUrl || c.profile_path;
                        castMap.set(key, existing);
                    }
                }
            });
        }

        // 2. Process Directors
        if (m.director) {
            const directors = m.director.split(',').map((d: string) => d.trim());
            directors.forEach((name: string) => {
                if (!name) return;
                if (!directorMap.has(name)) {
                    directorMap.set(name, {
                        name: name,
                        image_url: null, // Directors usually don't have images in movie json
                        tmdb_id: null
                    });
                }
            });
        }
    });

    console.log(`Found ${castMap.size} unique actors and ${directorMap.size} unique directors.`);

    // Upsert Cast
    const castArray = Array.from(castMap.values());
    // Processing in chunks of 100 to avoid request size limits
    console.log('Upserting Cast...');
    for (let i = 0; i < castArray.length; i += 100) {
        const chunk = castArray.slice(i, i + 100);
        const { error } = await supabase.from('cast').upsert(chunk, {
            onConflict: 'name',
            ignoreDuplicates: false
        });

        // Note: We used 'name' as conflict target for simplicity as IDs might be missing. 
        // If 'tmdb_id' exists and is unique, it's better, but let's stick to name for safety if ID is mixed.
        // Actually the schema has unique(tmdb_id) AND unique(name). 
        // Upsert needs a single constraint. Let's try upserting with primary match on 'name' for now 
        // because that's the guaranteed field.

        if (error) {
            console.error('Error upserting cast chunk:', error);
            // Fallback: Try one by one if bulk fails?
        } else {
            process.stdout.write('.');
        }
    }
    console.log('\nCast migration complete.');

    // Upsert Directors
    const directorArray = Array.from(directorMap.values());
    console.log('Upserting Directors...');
    for (let i = 0; i < directorArray.length; i += 100) {
        const chunk = directorArray.slice(i, i + 100);
        const { error } = await supabase.from('directors').upsert(chunk, {
            onConflict: 'name',
            ignoreDuplicates: false
        });
        if (error) console.error('Error upserting directors chunk:', error);
        else process.stdout.write('.');
    }
    console.log('\nDirector migration complete.');
}

migratePeople()
    .then(() => console.log('Script execution finished.'))
    .catch(err => console.error('Script failed:', err));
