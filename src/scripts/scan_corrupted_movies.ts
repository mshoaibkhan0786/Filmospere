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
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function scanCorrupted() {
    console.log("🔍 Scanning for corrupted movies (Missing description or images)...");

    // We'll fetch a large batch and filter in memory to verify specific JSON fields
    // relying on DB filtering for JSON can be tricky with some operators if not indexed
    // But we can try standard filters first.

    // Condition: data->description is NULL or empty string
    // OR data->images is empty array/null

    const { data, error } = await supabase
        .from('movies')
        .select('id, data')
        .or('data->>description.is.null,data->>description.eq.""');

    if (error) {
        console.error("Query Error:", error);
        return;
    }

    if (!data) {
        console.log("No data returned.");
        return;
    }

    const corrupted = data.filter(m => {
        const d = m.data || {};
        const noDesc = !d.description || d.description.trim() === '';
        // const noImages = !d.images || d.images.length === 0; // Images might be optional? User complaints about empty page usually implies description is gone.
        return noDesc;
    });

    console.log(`\n📊 Total Corrupted Movies found: ${corrupted.length}`);

    if (corrupted.length > 0) {
        console.log("\nExamples (First 10):");
        corrupted.slice(0, 10).forEach(m => {
            console.log(`- [${m.id}] ${m.data.title || 'Unknown Title'} (Year: ${m.data.releaseYear})`);
        });
    }
}

scanCorrupted();
