
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportActors() {
    console.log('Fetching actors from Supabase...');

    // Fetch all rows from 'cast' table
    // Supabase limits rows per request (default 1000), so we page
    let allActors = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('cast')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Error fetching actors:', error);
            break;
        }

        if (!data || data.length === 0) break;

        allActors = [...allActors, ...data];
        console.log(`Fetched ${data.length} rows (Total: ${allActors.length})`);

        if (data.length < pageSize) break; // Reached end
        page++;
    }

    // Prepare output format (Object map by ID or raw array?)
    // Existing actors.json seems to be an object map based on previous usage context, 
    // or arguably an array. Let's check existing format usage or standard.
    // Usually 'actors.json' is a map keyed by tmdbId for fast lookup.

    const actorMap = {};
    allActors.forEach(actor => {
        // cast table usually has 'tmdb_id' or 'id'
        const key = actor.tmdb_id || actor.id;
        if (key) actorMap[key] = actor;
    });

    const outputPath = path.join(process.cwd(), 'public', 'actors.json');
    const backupPath = path.join(process.cwd(), 'public', 'actors_legacy.json');

    // Rename old file if exists
    if (fs.existsSync(outputPath)) {
        fs.renameSync(outputPath, backupPath);
        console.log(`Backed up old actors.json to actors_legacy.json`);
    }

    fs.writeFileSync(outputPath, JSON.stringify(actorMap, null, 2));
    console.log(`Successfully saved ${Object.keys(actorMap).length} actors to public/actors.json`);
}

exportActors();
