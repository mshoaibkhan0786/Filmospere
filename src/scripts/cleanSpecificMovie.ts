
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    // Fetch specific movie
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', '%Yeh Jawaani Hai Deewani%')
        .limit(1);

    if (error || !data || data.length === 0) {
        console.log('Movie not found');
        return;
    }

    const row = data[0];
    const originalLinks = row.data.streamingLinks || [];

    if (originalLinks.length === 0) return;

    // Deduplication Logic
    const uniqueLinksMap = new Map();
    const normalizePlatform = (p: string) => {
        const lower = p.toLowerCase();
        if (lower.includes('netflix')) return 'netflix';
        if (lower.includes('prime video') || lower.includes('amazon video')) return 'amazon prime video';
        if (lower.includes('disney') || lower.includes('hotstar')) return 'disney+';
        if (lower.includes('hulu')) return 'hulu';
        if (lower.includes('hbo') || lower.includes('max')) return 'hbo max';
        if (lower.includes('apple tv')) return 'apple tv';
        if (lower.includes('peacock')) return 'peacock';
        if (lower.includes('paramount')) return 'paramount+';
        if (lower.includes('tubi')) return 'tubi';
        if (lower.includes('crunchyroll')) return 'crunchyroll';
        if (lower.includes('youtube')) return 'youtube';
        if (lower.includes('zee5')) return 'zee5';
        if (lower.includes('jio')) return 'jiocinema';
        if (lower.includes('sony')) return 'sonyliv';
        return lower.trim();
    };

    originalLinks.forEach((link: any) => {
        const platform = normalizePlatform(link.platform);
        const country = link.country || 'US';
        const key = `${platform}-${country.toLowerCase()}`;

        if (uniqueLinksMap.has(key)) {
            const existing = uniqueLinksMap.get(key);
            if (!existing.url && link.url) {
                uniqueLinksMap.set(key, link);
            } else if (existing.url && !link.url) {
                // keep existing
            } else {
                if (link.platform.length < existing.platform.length) {
                    uniqueLinksMap.set(key, link);
                }
            }
        } else {
            uniqueLinksMap.set(key, link);
        }
    });

    const newLinks = Array.from(uniqueLinksMap.values());
    console.log(`Cleaning "${row.title}": ${originalLinks.length} -> ${newLinks.length} links`);

    row.data.streamingLinks = newLinks;

    const { error: updateError } = await supabase
        .from('movies')
        .update({ data: row.data })
        .eq('id', row.id);

    if (updateError) console.error('Update failed:', updateError);
    else console.log('Successfully updated.');
}

main();
