
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkContentQuality() {
    // Fetch 20 movies and verify they have optimization data
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .not('data->whyWatch', 'is', null) // Only optimized ones
        .limit(20);

    if (error) {
        console.error('Error fetching movies:', error);
        return;
    }

    if (!movies || movies.length === 0) {
        console.log('No optimized movies found to sample.');
        return;
    }

    // Pick 3 random ones
    const sample = movies.sort(() => 0.5 - Math.random()).slice(0, 3);

    console.log(`\n🔍 Sampling ${sample.length} Optimized Movies:\n`);

    sample.forEach((m, i) => {
        const d = m.data;
        console.log(`--- Movie #${i + 1}: ${d.title} (${d.releaseDate}) ---`);
        console.log(`📝 Meta Title: ${d.metaTitle}`);
        console.log(`📝 Meta Desc:  ${d.metaDescription}`);
        console.log(`🍿 Why Watch:`);
        d.whyWatch?.forEach(w => console.log(`   - ${w}`));
        console.log(`📖 Description Start: "${d.description?.substring(0, 100)}..."`);
        console.log(`🏷️  Keywords: ${d.keywords}`);
        console.log('\n');
    });
}

checkContentQuality();
