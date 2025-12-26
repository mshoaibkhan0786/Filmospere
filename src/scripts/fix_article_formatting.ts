
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fixing Article Formatting (Double Newlines for Headers)...");

    // Fetch all articles
    const { data: articles, error } = await supabase.from('articles').select('id, title, content');

    if (error) {
        console.error("Fetch Error:", error);
        return;
    }

    console.log(`Checking ${articles.length} articles...`);
    let updatedCount = 0;

    for (const a of articles) {
        let content = a.content || '';
        if (!content) continue;

        const originalLength = content.length;

        // REGEX EXPLANATION:
        // Look for any character that is NOT a newline ([^\n])
        // Followed by optional whitespace (\s*)
        // Followed by ## or ### (headers)
        // Replace with: The text char + \n\n + the header

        // Fix 1: Header inline or single newline
        content = content.replace(/([^\n])\s*(\n)?\s*(#{2,})/g, '$1\n\n$3');

        // Fix 2: Also ensure spaces AFTER ## (e.g. ##Title -> ## Title)
        content = content.replace(/(#{2,})([^\s])/g, '$1 $2');

        if (content.length !== originalLength) {
            console.log(`Fixing: ${a.title}`);
            const { error: updateError } = await supabase
                .from('articles')
                .update({ content: content })
                .eq('id', a.id);

            if (updateError) console.error(`   ❌ Failed: ${updateError.message}`);
            else {
                updatedCount++;
                console.log(`   ✅ Updated.`);
            }
        }
    }

    console.log(`\nFixed formatting for ${updatedCount} articles.`);
}

main();
