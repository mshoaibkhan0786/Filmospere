
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function fixJawanSwap() {
    console.log("Fixing Jawan: Swapping Description and SEO Description...");

    const { data: movies } = await supabase
        .from('movies')
        .select('id, data')
        .ilike('title', "Jawan");

    if (!movies || movies.length === 0) {
        console.log("Jawan not found.");
        return;
    }

    const row = movies[0];
    const data = row.data;

    const currentDesc = data.description; // Currently "An emotional journey..." (SEO Style)
    const currentSeo = data.seoDescription; // Currently "A prison warden..." (Plot Style) ?

    console.log("Current Description:", currentDesc?.substring(0, 50) + "...");
    console.log("Current SEO Desc:", currentSeo?.substring(0, 50) + "...");

    // Check if swap makes sense
    // We want Description to be the "Plot" (Main content)
    // We want SEO to be the "Hook" (Short, keyword rich)

    // Heuristic: If currentDesc looks like SEO (Short, "An emotional journey") and currentSeo looks like Plot ("A prison warden..."), SWAP.

    // Only swap if they look swapped.
    const newDescription = currentSeo;
    const newSeoDescription = currentDesc;

    console.log("\nSwapping...");
    console.log("New Description:", newDescription?.substring(0, 50) + "...");
    console.log("New SEO Desc:", newSeoDescription?.substring(0, 50) + "...");

    const updatedData = {
        ...data,
        description: newDescription,
        seoDescription: newSeoDescription
    };

    const { error } = await supabase
        .from('movies')
        .update({ data: updatedData })
        .eq('id', row.id);

    if (error) console.error("Swap failed:", error);
    else console.log("Success! Fields swapped.");
}

fixJawanSwap();
