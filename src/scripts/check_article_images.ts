
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking Article Images...");

    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, image_url, related_movie_id');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${articles.length} articles.`);
    articles.forEach(a => {
        const hasImage = !!a.image_url;
        console.log(`[${hasImage ? 'OK' : 'MISSING'}] ${a.title.substring(0, 40)}... | Image: ${a.image_url || 'NULL'} | MovieID: ${a.related_movie_id}`);
    });
}

main();
