
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Keys');
    process.exit(1);
}

// Service Role client config
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const targetKeywords = [
    'Dune', 'Balinsasayaw', 'Kulong', 'Eks', 'Rita', 'Arouse', 'Bayo', 'Ekis', 'Kirot', 'Anor'
];

async function main() {
    console.log('🔍 Connecting to DB with Service Key...');

    // 1. Check Connection
    const { data: checkData, error: checkError } = await supabase.from('movies').select('id, title').limit(1);

    if (checkError) {
        console.error('❌ Connection Failed:', checkError);
        return;
    }
    console.log(`✅ Connected. Found movie: "${checkData[0]?.title}"`);

    // 2. Search Candidates
    let candidates = [];
    for (const kw of targetKeywords) {
        const { data } = await supabase.from('movies').select('id, title, release_date').ilike('title', `%${kw}%`);
        if (data && data.length > 0) {
            console.log(`\n🎯 Matches for "${kw}":`);
            data.forEach(m => {
                console.log(`   - [${m.id}] ${m.title} (${m.release_date})`);
                candidates.push(m);
            });
        }
    }

    if (candidates.length === 0) {
        console.log('\n❌ No target movies found.');
        return;
    }

    // Dedupe
    const uniqueCandidates = [...new Map(candidates.map(item => [item.id, item])).values()];
    console.log(`\nFound ${uniqueCandidates.length} unique candidates.`);

    // 3. Find Exclusive Actors
    console.log('🕵️ Finding exclusive actors...');
    const movieIds = uniqueCandidates.map(c => c.id);
    const exclusiveActors = [];

    const { data: castData } = await supabase.from('movie_cast')
        .select('person_id, person:cast(name)')
        .in('movie_id', movieIds);

    if (castData) {
        const uniquePids = [...new Set(castData.map(c => c.person_id))];
        for (const pid of uniquePids) {
            const { data: roles } = await supabase.from('movie_cast').select('movie_id').eq('person_id', pid);
            // Exclusive if ALL roles are in our delete list
            if (roles.every(r => movieIds.includes(r.movie_id))) {
                const name = castData.find(c => c.person_id === pid)?.person?.name;
                exclusiveActors.push({ id: pid, name });
            }
        }
    }

    console.log(`\n⚠️  READY TO DELETE:`);
    console.log(`- ${uniqueCandidates.length} Movies: ${uniqueCandidates.map(m => m.title).join(', ')}`);
    console.log(`- ${exclusiveActors.length} Exclusive Actors`);

    // 4. Delete
    console.log('\n🚀 Deleting in 3s...');
    await new Promise(r => setTimeout(r, 3000));

    // Delete relationships first
    await supabase.from('movie_cast').delete().in('movie_id', movieIds);
    // Delete movies
    await supabase.from('movies').delete().in('id', movieIds);
    console.log('✅ Movies Deleted');

    // Delete actors
    if (exclusiveActors.length > 0) {
        await supabase.from('cast').delete().in('id', exclusiveActors.map(a => a.id));
        console.log(`✅ Actors Deleted`);
    } else {
        console.log('No exclusive actors to delete.');
    }
}

main();
