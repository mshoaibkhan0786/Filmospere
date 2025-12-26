import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Setup Supabase Client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL; // Re-use the VITE one
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY; // TRY ANON KEY FOR DIAGNOSIS

console.log('DEBUG: Config Check');
console.log('URL:', SUPABASE_URL);
console.log('Key (Type):', 'ANON (Public)');
console.log('Key Length:', SUPABASE_KEY ? SUPABASE_KEY.length : 0);
console.log('Key Start:', SUPABASE_KEY ? SUPABASE_KEY.substring(0, 10) + '...' : 'MISSING');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

async function migrate() {
    console.log('🚀 Starting Migration to Supabase...');

    // 2. Read Local Data
    const tmdbPath = path.join(__dirname, '../data/tmdbMovies.json');
    if (!fs.existsSync(tmdbPath)) {
        console.error('❌ tmdbMovies.json not found!');
        process.exit(1);
    }

    console.log('📖 Reading JSON data...');
    const rawData = fs.readFileSync(tmdbPath, 'utf-8');
    const movies = JSON.parse(rawData);
    console.log(`✅ Loaded ${movies.length} movies.`);

    // 3. Batch Upload
    const BATCH_SIZE = 100;
    const totalBatches = Math.ceil(movies.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
        const batch = movies.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

        // Transform to DB Schema
        const rows = batch.map((m: any) => ({
            id: m.id,
            title: m.title,
            data: m, // Store full JSON object
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('movies')
            .upsert(rows, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Error uploading batch ${i + 1}/${totalBatches}:`, error.message);
        } else {
            console.log(`✨ Uploaded batch ${i + 1}/${totalBatches} (${rows.length} movies)`);
        }
    }

    console.log('🎉 Migration Complete!');
}

migrate().catch(console.error);
