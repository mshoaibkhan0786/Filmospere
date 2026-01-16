
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:\\WEB DEV\\Filmospere\\Filmospere Repo\\next-app\\.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCache() {
    console.log('Fetching home_cache...');
    const { data: cacheData, error } = await supabase
        .from('home_cache')
        .select('content')
        .eq('id', 'home_feed')
        .single();

    if (error) {
        console.error('Error fetching cache:', error);
        return;
    }

    if (!cacheData || !cacheData.content) {
        console.error('No content in cache');
        return;
    }

    const sections = cacheData.content.sections || [];
    console.log(`Found ${sections.length} sections in cache.`);

    // Inspect first section (should be Latest or Trending)
    const firstSection = sections[0];
    if (firstSection && firstSection.data) {
        console.log(`Section: ${firstSection.title}`);
        console.log(`Movie Count: ${firstSection.data.length}`);

        // Log first movie fully
        if (firstSection.data.length > 0) {
            const m = firstSection.data[0];
            console.log('First Movie Data:');
            console.log(`Title: ${m.title}`);
            console.log(`PosterURL: [${m.posterUrl}]`);
            console.log(`PosterPath: [${m.poster_path}]`);
            console.log(`Images: [${(m.images || []).join(', ')}]`);
        }
    }

    // Inspect Series section
    const seriesSection = sections.find((s: any) => s.title.includes('Series'));
    if (seriesSection && seriesSection.data) {
        console.log(`\nSection: ${seriesSection.title}`);
        seriesSection.data.slice(0, 5).forEach((m: any, i: number) => {
            console.log(`[${i}] Title: "${m.title}", PosterUrl: "${m.posterUrl}", PosterPath: "${m.poster_path}"`);
        });
    }
}

checkCache();
