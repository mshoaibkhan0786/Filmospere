
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCast() {
    const TARGET_ID = 'tmdb-79352';

    const { data: record, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', TARGET_ID)
        .single();

    if (error || !record) {
        console.error('Error fetching:', error);
        return;
    }

    const data = record.data;
    let updated = false;

    if (data.cast && Array.isArray(data.cast)) {
        data.cast = data.cast.map((c: any) => {
            if (typeof c.id === 'number') {
                updated = true;
                return { ...c, id: `tmdb-person-${c.id}` };
            }
            if (typeof c.id === 'string' && !c.id.startsWith('tmdb-person-') && /^\d+$/.test(c.id)) {
                updated = true;
                return { ...c, id: `tmdb-person-${c.id}` };
            }
            return c;
        });
    }

    if (updated) {
        const { error: updateError } = await supabase
            .from('movies')
            .update({ data: data })
            .eq('id', TARGET_ID);

        if (updateError) {
            console.error('Update failed:', updateError);
        } else {
            console.log('Fixed cast IDs for Sacred Games.');
        }
    } else {
        console.log('No cast IDs needed fixing.');
    }
}

fixCast();
