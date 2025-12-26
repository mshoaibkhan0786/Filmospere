
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🕵️ Checking ID Formats...');

    // 1. Fetch a movie with cast
    const { data: movies, error: err1 } = await supabase
        .from('movies')
        .select('id, title, data')
        .limit(1);

    if (err1) console.error('Movie fetch error:', err1);
    else if (movies && movies.length > 0) {
        const m = movies[0];
        console.log(`\n🎬 Movie: ${m.title} (${m.id})`);
        const cast = m.data?.cast || [];
        if (cast.length > 0) {
            console.log(`   First Cast Member ID inside JSON: "${cast[0].id}"`);
            console.log(`   Format check: Is string? ${typeof cast[0].id}`);
        } else {
            console.log('   (No cast in this movie)');
        }
    }

    // 2. Fetch an actor from cast table
    const { data: actors, error: err2 } = await supabase
        .from('cast')
        .select('id, name, tmdb_id')
        .limit(1);

    if (err2) console.error('Actor fetch error:', err2);
    else if (actors && actors.length > 0) {
        const a = actors[0];
        console.log(`\n👤 Actor: ${a.name}`);
        console.log(`   ID (PK): "${a.id}"`);
        console.log(`   tmdb_id: "${a.tmdb_id}"`);
    }
}

main();
