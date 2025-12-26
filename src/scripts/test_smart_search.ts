
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testSearch(query: string) {
    console.log(`Testing search for: "${query}"...`);
    const start = performance.now();

    // Smart Query: Title OR Tags OR Director OR Cast (in JSON)
    // Note: 'cast' in JSON is complex, but we can search cast names if flattened or check raw JSON text
    // data->>cast is a JSON array string. ilike works on it but might be slow.
    // Let's stick to high-value targets: Title, Tags, Director.

    const { data, error, count } = await supabase
        .from('movies')
        .select('title, data', { count: 'exact' })
        .or(`title.ilike.%${query}%,data->>tags.ilike.%${query}%,data->>director.ilike.%${query}%`)
        .limit(20);

    const end = performance.now();
    console.log(`Time: ${(end - start).toFixed(2)}ms`);

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log(`Found ${count} results.`);
        data?.forEach(m => console.log(`- ${m.title} (Tags: ${m.data.tags?.slice(0, 3)})`));
    }
}

async function main() {
    await testSearch('Leonardo'); // Actor/Director?
    await testSearch('Action');   // Genre
    await testSearch('Inception'); // Title
}

main();
