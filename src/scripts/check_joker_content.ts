
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
    const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .ilike('title', '%Joker%Final%');

    if (articles && articles.length > 0) {
        const a = articles[0];
        console.log(`Title: ${a.title}`);
        console.log("--- Content Snippet ---");
        // Log the part around "##"
        const index = a.content.indexOf('##');
        if (index !== -1) {
            // Show 50 chars before and after
            console.log(JSON.stringify(a.content.substring(Math.max(0, index - 50), index + 50)));
        } else {
            console.log("No '##' found.");
        }
        console.log("--- Full Content Start ---");
        console.log(JSON.stringify(a.content.substring(0, 500)));
    } else {
        console.log("Article not found.");
    }
}

main();
