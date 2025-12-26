
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function forceUpdate() {
    console.log("Force Updating 'Kapag Tumayo Ang Testigo'...");

    // 1. Fetch
    const { data: movies } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', 'Kapag Tumayo%');

    if (!movies || movies.length === 0) return;

    const m = movies[0];
    console.log(`Before: Votes=${m.data.voteCount}, Rating=${m.data.rating}`);

    // 2. Update
    const updatedData = {
        ...m.data,
        voteCount: 0,
        rating: 0
    };

    const { data, error } = await supabase
        .from('movies')
        .update({ data: updatedData })
        .eq('id', m.id)
        .select();

    if (error) {
        console.error("UPDATE ERROR:", error);
    } else {
        console.log("Update Success?", data && data.length > 0);
        if (data && data.length > 0) {
            console.log(`After: Votes=${data[0].data.voteCount}, Rating=${data[0].data.rating}`);
        }
    }
}

forceUpdate();
