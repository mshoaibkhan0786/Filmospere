import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Missing Supabase environment variables. Using dummy values to allow build to complete.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: (url, options) => {
            const method = options?.method?.toUpperCase() || 'GET';
            // Only apply ISR caching on GET requests where cache is not explicitly overridden
            if (method === 'GET' && !options?.cache) {
                return fetch(url, {
                    ...options,
                    next: { ...(options as any)?.next, revalidate: 3600 }
                });
            }
            return fetch(url, options);
        }
    }
});
