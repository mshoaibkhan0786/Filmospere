
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
    console.log("Fixing Article Formatting: Ensuring Newlines AFTER Headers...");

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
        // Match a header line (## Title) that is followed by a SINGLE newline and then text.
        // Group 1: (Start of string or newline) and the header (## ... until end of line)
        // Group 2: The single newline \n
        // Group 3: The next line content (NOT a newline)

        // This regex looks for: ## Header \n Text
        // And changes it to: ## Header \n\n Text

        // Note: [^\n] means any char except newline. . matches anything except newline.
        content = content.replace(/(^|\n)(#{2,}[^\n]+)\n([^\n])/g, '$1$2\n\n$3');

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
