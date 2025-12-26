
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function scanDeepCorruption() {
    console.log("🔍 Scanning for Deep Corruption (Manoos/Prabhat/etc)...");

    const { data: movies, error } = await supabase
        .from('movies')
        .select('*');

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    if (!movies) return;

    let suspectCount = 0;

    movies.forEach(row => {
        const m = row.data;
        const id = row.id;
        const title = m.title;

        let reasons: string[] = [];

        // Check 1: Old Manoos Corruption
        if (m.originalTitle === 'Manoos' || (m.productionCompanies && m.productionCompanies.includes('Prabhat Films'))) {
            reasons.push('Contains "Manoos" or "Prabhat Films" artifact');
        }

        // Check 2: Description Mismatch (Short/Empty)
        if (!m.description || m.description.length < 10) {
            reasons.push('Description missing/too short');
        }

        // Check 3: Suspicious Title Mismatch (English movies usually usually have same original title)
        // Only flag if Language is English but Original Title is vastly different
        // and NOT a known pattern like "The X" vs "X"
        if (m.language === 'English' && m.originalTitle && m.title) {
            const t1 = m.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const t2 = m.originalTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

            // Allow simplified matches, but flag big differences
            if (!t1.includes(t2) && !t2.includes(t1) && reasons.length === 0) {
                // reasons.push(`Title mismatch: "${m.title}" vs Original: "${m.originalTitle}"`);
                // Commented out to reduce noise, enable if needed
            }
        }

        if (reasons.length > 0) {
            suspectCount++;
            console.log(`\n⚠️  SUSPECT: [${id}] "${title}"`);
            reasons.forEach(r => console.log(`   - ${r}`));
        }
    });

    console.log(`\n✅ Scan Complete. Found ${suspectCount} suspect entries.`);
}

scanDeepCorruption();
