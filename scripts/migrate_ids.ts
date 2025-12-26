
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CONCURRENCY = 50;

async function migrate() {
    console.log('🚀 Starting ID Migration (cast- -> tmdb-person-)...');

    // 1. Fetch all rows with 'cast-%'
    let allCastRows: any[] = [];
    let fetchOffset = 0;
    while (true) {
        const { data: chunk, error } = await supabase
            .from('cast')
            .select('*')
            .ilike('tmdb_id', 'cast-%')
            .range(fetchOffset, fetchOffset + 999);

        if (error) {
            console.error('Error fetching cast- rows:', error);
            break;
        }
        if (!chunk || chunk.length === 0) break;

        allCastRows = allCastRows.concat(chunk);
        fetchOffset += 1000;
        process.stdout.write(`\rLoaded ${allCastRows.length} 'cast-' rows...`);
    }
    console.log('\n✅ Loaded all rows to migrate.');

    let migrated = 0;
    let merged = 0;
    let errors = 0;

    // Helper for single row migration
    const processRow = async (row: any) => {
        // Extract numeric ID
        const match = row.tmdb_id.match(/-(\d+)$/);
        if (!match) {
            // console.log(`⚠️  Skipping invalid format: ${row.tmdb_id}`);
            return;
        }

        const numericId = match[1];
        const newId = `tmdb-person-${numericId}`;

        // Check destination
        const { data: existingTarget } = await supabase
            .from('cast')
            .select('*')
            .eq('tmdb_id', newId)
            .single();

        if (existingTarget) {
            // MERGE
            if (row.biography && row.biography.length > 50) {
                const { error: updateError } = await supabase
                    .from('cast')
                    .update({
                        biography: row.biography,
                        image_url: row.image_url || existingTarget.image_url,
                        updated_at: new Date().toISOString()
                    })
                    .eq('tmdb_id', newId);

                if (updateError) {
                    errors++;
                } else {
                    await supabase.from('cast').delete().eq('tmdb_id', row.tmdb_id);
                    merged++;
                }
            } else {
                await supabase.from('cast').delete().eq('tmdb_id', row.tmdb_id);
                merged++;
            }
        } else {
            // MOVE
            const { error: moveError } = await supabase
                .from('cast')
                .update({ tmdb_id: newId })
                .eq('tmdb_id', row.tmdb_id);

            if (moveError) {
                errors++;
            } else {
                migrated++;
            }
        }
    };

    // Parallel Processing
    for (let i = 0; i < allCastRows.length; i += CONCURRENCY) {
        const batch = allCastRows.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(row => processRow(row)));
        process.stdout.write(`\rProgress: Migrated ${migrated} | Merged ${merged} | Errors ${errors}`);
    }

    console.log('\n\n🏁 Migration Complete.');
    console.log(`   - Renamed: ${migrated}`);
    console.log(`   - Merged & Deleted Duplicates: ${merged}`);
    console.log(`   - Errors: ${errors}`);
}

migrate();
