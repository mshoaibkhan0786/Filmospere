
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkJawanLinks() {
    const { data: movie, error } = await supabase
        .from('movies')
        .select('id, title, data')
        .ilike('title', '%Jawan%')
        .limit(1)
        .single();

    if (error) {
        console.error("Error fetching movie:", error);
        return;
    }

    if (movie && movie.data && movie.data.streamingLinks) {
        console.log(`\nLinks for ${movie.title} (${movie.data.streamingLinks.length}):`);
        movie.data.streamingLinks.forEach(link => {
            console.log(`- Platform: "${link.platform}", Type: "${link.type}", URL: ${link.url}`);
        });

        // Simulate logic
        const streamTypes = ['flatrate', 'ads', 'free'];
        const streamingLinks = movie.data.streamingLinks.filter(l => streamTypes.includes(l.type));
        const streamingPlatforms = new Set(streamingLinks.map(l => l.platform.toLowerCase().trim()));

        console.log("\nStreaming Platforms (Normalized):", Array.from(streamingPlatforms));

        const rentBuyLinks = movie.data.streamingLinks.filter(l => !streamTypes.includes(l.type) && !streamingPlatforms.has(l.platform.toLowerCase().trim()));

        console.log("\nFiltered Rent/Buy Links:");
        rentBuyLinks.forEach(l => console.log(`- Platform: "${l.platform}"`));

        const rawRentBuyLinksForDebug = movie.data.streamingLinks.filter(l => !streamTypes.includes(l.type));
        console.log("\nRaw Rent/Buy Links (Before Filter):");
        rawRentBuyLinksForDebug.forEach(l => {
            const p = l.platform.toLowerCase().trim();
            const isExcluded = streamingPlatforms.has(p);
            console.log(`- Platform: "${l.platform}" [Norm: "${p}"] -> Excluded? ${isExcluded}`);
        });

    } else {
        console.log("No streaming links found.");
    }
}

checkJawanLinks();
