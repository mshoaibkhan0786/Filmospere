
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpMovies() {
    console.log('Fetching all movies from Supabase (Keyset Pagination)...');

    const allMovies = [];
    let lastId = '';
    const pageSize = 100; // Small batch
    let hasMore = true;

    while (hasMore) {
        let query = supabase
            .from('movies')
            .select('id, data')
            .order('id', { ascending: true })
            .limit(pageSize);

        if (lastId) {
            query = query.gt('id', lastId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching movies:', error.message);
            console.log('Waiting 5s before retry...');
            await new Promise(r => setTimeout(r, 5000));
            // Try ONE retry?
            // For now, break to avoid infinite loop
            break;
        }

        if (!data || data.length === 0) {
            hasMore = false;
            break;
        }

        // Normalize data
        const formatted = data.map(row => ({
            ...row.data,
            id: row.id,
            posterUrl: row.data.posterUrl || row.data.poster_path || '',
        }));

        allMovies.push(...formatted);
        lastId = data[data.length - 1].id;

        // Less logging to avoid spam
        if (allMovies.length % 500 === 0) {
            console.log(`Fetched ${data.length} records. Last ID: ${lastId} (Total: ${allMovies.length})`);
        } else if (allMovies.length < 500) {
            console.log(`Fetched ${data.length} records...`);
        }

        if (data.length < pageSize) hasMore = false;

        // Add delay
        await new Promise(r => setTimeout(r, 200));
    }

    const distDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
    }

    const outputPath = path.join(distDir, 'movies.json');
    fs.writeFileSync(outputPath, JSON.stringify(allMovies, null, 2));
    console.log(`✅ Successfully dumped ${allMovies.length} movies to ${outputPath}`);
}

dumpMovies();
