
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkPerformance() {
    const slug = 'exit-8-2025';
    console.log(`⏱️ Benchmarking slug lookup for: ${slug}`);

    for (let i = 1; i <= 10; i++) {
        const start = performance.now();
        const { data, error } = await supabase
            .from('movies')
            .select('id')
            .eq('data->>slug', slug)
            .single();
        const end = performance.now();

        const duration = (end - start).toFixed(2);

        if (error) {
            console.log(`Run ${i}: ❌ FAILED in ${duration}ms - ${error.message}`);
        } else if (!data) {
            console.log(`Run ${i}: ⚠️ NOT FOUND in ${duration}ms`);
        } else {
            console.log(`Run ${i}: ✅ Found (${data.id}) in ${duration}ms`);
        }
    }
}

checkPerformance();
