
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function auditOptimized() {
    console.log("Auditing Optimized Movies (Sample 20)...");

    const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .eq('data->>isOptimized', 'true')
        .limit(20);

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    if (!movies || movies.length === 0) {
        console.log("No optimized movies found in DB.");
        return;
    }

    console.log(`Found ${movies.length} optimized movies.`);

    let missingDesc = 0;
    let missingSEO = 0;
    let missingWhyWatch = 0;

    movies.forEach(m => {
        const d = m.data;
        const descLen = d.description?.length || 0;
        const seoLen = d.seoDescription?.length || 0;
        const wwLen = d.whyWatch?.length || 0;

        if (descLen < 10) missingDesc++;
        if (seoLen < 10) missingSEO++;
        if (wwLen === 0) missingWhyWatch++;

        console.log(`\n[${m.title}]`);
        console.log(`  > Desc: ${descLen} chars | ${d.description?.substring(0, 40).replace(/\n/g, '')}...`);
        console.log(`  > SEO:  ${seoLen} chars | ${d.seoDescription?.substring(0, 40).replace(/\n/g, '')}...`);
        console.log(`  > WhyWatch: ${wwLen} items`);
    });

    console.log("\n--- SUMMARY ---");
    console.log(`Total Checked: ${movies.length}`);
    console.log(`Missing/Short Description: ${missingDesc}`);
    console.log(`Missing/Short SEO Desc: ${missingSEO}`);
    console.log(`Missing WhyWatch: ${missingWhyWatch}`);
}

auditOptimized();
