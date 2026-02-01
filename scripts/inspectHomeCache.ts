
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:\\WEB DEV\\Filmospere\\Filmospere Repo\\.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey!);

async function inspectCache() {
    console.log('🔍 Inspecting Home Cache...');
    const { data, error } = await supabase
        .from('home_cache')
        .select('content')
        .eq('id', 'home_feed')
        .single();

    if (error) {
        console.error('❌ Error reading cache:', error);
        return;
    }

    if (!data || !data.content) {
        console.error('❌ Cache is empty or null');
        return;
    }

    const sections = (data.content as any).sections || [];
    console.log(`✅ Found ${sections.length} sections in cache.`);

    sections.forEach((sec: any) => {
        console.log(`   - [${sec.title}]: ${sec.data.length} items`);
        if (sec.title === 'Action' || sec.title === 'Comedy') {
            if (sec.data.length > 0) {
                console.log(`     First Item: ${sec.data[0].title} (Tags: ${JSON.stringify(sec.data[0].tags)})`);
            }
        }
    });
}

inspectCache();
