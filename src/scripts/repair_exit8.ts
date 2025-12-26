
import { createClient } from '@supabase/supabase-js';
import { TMDB } from 'tmdb-ts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
const tmdb = new TMDB(process.env.VITE_TMDB_API_KEY!);

async function repairExit8() {
    const targetId = '1408208'; // Exit 8 TMDB ID
    console.log(`🔧 Repairing Exit 8 (TMDB ID: ${targetId})...`);

    try {
        // 1. Fetch FRESH data from TMDB
        const details = await tmdb.movies.details(parseInt(targetId), ['credits', 'videos', 'images', 'release_dates']);

        if (!details) {
            console.error("❌ TMDB returned no data.");
            return;
        }

        // 2. Extract Director
        const director = details.credits?.crew.find(c => c.job === 'Director')?.name || 'Unknown';

        // 3. Extract Cast (Top 10)
        const cast = details.credits?.cast.slice(0, 10).map(c => ({
            id: `tmdb-person-${c.id}`,
            name: c.name,
            role: c.character,
            imageUrl: c.profile_path || null
        })) || [];

        console.log(`Found Data -> Director: ${director}, Cast: ${cast.length}`);

        // 4. Get Existing Supabase Record to preserve AI descriptions
        const { data: existingRows } = await supabase
            .from('movies')
            .select('*')
            .eq('id', `tmdb-${targetId}`)
            .single();

        let mergedData = existingRows?.data || {};

        // 5. Update Fields
        mergedData = {
            ...mergedData,
            director: director,
            cast: cast,
            voteCount: details.vote_count,
            rating: details.vote_average,
            runtime: details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : mergedData.runtime
        };

        // 6. Push to Supabase
        const { error } = await supabase
            .from('movies')
            .update({ data: mergedData })
            .eq('id', `tmdb-${targetId}`);

        if (error) {
            console.error("❌ Failed to update Supabase:", error.message);
        } else {
            console.log("✅ Successfully updated 'Exit 8' in Supabase!");
        }

    } catch (err: any) {
        console.error("❌ Error:", err.message);
    }
}

repairExit8();
