
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('📊 Analyzing Cast Table Statistics...');

    // 1. Total Count
    const { count: total, error: err1 } = await supabase
        .from('cast')
        .select('*', { count: 'exact', head: true });

    if (err1) console.error('Error total:', err1);

    // 2. Null Bios
    const { count: nullBios, error: err2 } = await supabase
        .from('cast')
        .select('*', { count: 'exact', head: true })
        .is('biography', null);

    if (err2) console.error('Error null:', err2);

    // 3. Optimized Bios (> 50 chars) - We can't filter optimized exactly without fetching, 
    // but we can deduct from the known numbers if we fetch "non-null".

    // Let's iterate to count "Short Bios" (<= 50 chars) accurately
    let shortBiosCount = 0;
    let longBiosCount = 0;

    // Cursor pagination to check lengths
    const Batch = 1000;
    let lastId = '';

    console.log('Reading bios to check lengths...');

    while (true) {
        let q = supabase
            .from('cast')
            .select('tmdb_id, biography')
            .not('biography', 'is', null) // Only check existing bios
            .order('tmdb_id', { ascending: true })
            .limit(Batch);

        if (lastId) q = q.gt('tmdb_id', lastId);

        const { data, error } = await q;
        if (error || !data || data.length === 0) break;

        data.forEach(p => {
            if (p.biography.length > 50) longBiosCount++;
            else shortBiosCount++;
        });

        lastId = data[data.length - 1].tmdb_id;
        if (longBiosCount + shortBiosCount > 20000) break; // Sample limit if huge
    }

    console.log('\nResults:');
    console.log(`Total Person Records: ${total}`);
    console.log(`Missing Biographies (NULL): ${nullBios}`);
    console.log(`Analyzed Non-Null Bios: ${longBiosCount + shortBiosCount}`);
    console.log(`  - Local/Optimized (>50 chars): ${longBiosCount} (Included in Sitemap)`);
    console.log(`  - Short/Empty string (<=50 chars): ${shortBiosCount} (Excluded)`);
    console.log(`\nConclusion: You have ${total} people, but only ${longBiosCount} have good content.`);
}

main();
