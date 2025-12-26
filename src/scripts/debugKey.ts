import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';

console.log('URL:', url);
console.log('Anon Key Start:', anonKey.substring(0, 15));
console.log('Service Key Start:', serviceKey.substring(0, 15));

async function check() {
    console.log('--- Checking ANON KEY ---');
    const clientAnon = createClient(url, anonKey);
    const resAnon = await clientAnon.from('movies').select('id', { count: 'exact', head: true });
    console.log('Anon Result:', resAnon.error ? resAnon.error : 'Success. Count: ' + resAnon.count);

    console.log('--- Checking SERVICE KEY ---');
    const clientService = createClient(url, serviceKey);
    const resService = await clientService.from('movies').select('id', { count: 'exact', head: true });
    console.log('Service Result:', resService.error ? resService.error : 'Success. Count: ' + resService.count);
}

check();
