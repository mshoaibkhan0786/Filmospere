// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// Prioritize Anon Key for now to verify connectivity (since app works)
// If Service Key is broken, we'll fix later.
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

async function main() {
    console.log("Checking for Inception (tmdb-27205)...");

    // Search by title
    const { data: searchData, error: searchError } = await supabase
        .from('movies')
        .select('*')
        .ilike('data->>title', '%Family Plan%')
        .limit(5);

    if (searchError) {
        console.error("Search Error:", searchError);
    } else if (searchData && searchData.length > 0) {
        console.log(`Found ${searchData.length} matches:`);
        searchData.forEach(m => {
            console.log(`\n--- MOVIE: ${m.data.title} (${m.id}) ---`);
            console.log("Release Date:", m.data.releaseDate);
            console.log("Runtime:", m.data.runtime || m.data.duration);
            console.log("Tagline:", m.data.tagline);
            console.log("Overview length:", (m.data.description || '').length);
            console.log("Description:", m.data.description);
            console.log("Images:", m.data.images ? m.data.images.length : 'NULL');
            console.log("Poster:", m.data.posterUrl);
        });
    } else {
        // Also search by title loose
        const { data: byTitle } = await supabase
            .from('movies')
            .select('id, title')
            .ilike('title', '%Inception%');

        console.log("Search by title '%Inception%':", byTitle);
    }
}

main();
