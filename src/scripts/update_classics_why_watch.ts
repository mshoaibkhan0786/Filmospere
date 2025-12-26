
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl!, supabaseKey!);

const CLASSICS_CONTENT = [
    {
        title: "The Shop Around the Corner",
        metaTitle: "Watch The Shop Around the Corner (1940) • The Perfect Rom-Com",
        metaDescription: "Before You've Got Mail, there was The Shop Around the Corner. James Stewart and Margaret Sullavan star in this timeless holiday classic about love, letters, and mistaken identity.",
        whyWatch: [
            "❤️ The Original Rom-Com: The direct inspiration for 'You've Got Mail', but arguably warmer, funnier, and more touching.",
            "🎭 Jimmy Stewart's Magic: See James Stewart at his absolute peak charming vulnerability.",
            "❄️ Perfect Holiday Vibes: Set during Christmas in Budapest, it’s the ultimate cozy comfort movie."
        ]
    },
    {
        title: "Sullivan's Travels",
        metaTitle: "Watch Sullivan's Travels (1941) • A Comedy About Suffering",
        metaDescription: "A Hollywood director goes undercover as a hobo to understand real suffering, only to discover the life-saving power of laughter. Preston Sturges' satire masterpiece.",
        whyWatch: [
            "🧠 Smart Satire: A brilliant critique of Hollywood pretension that feels shockingly modern today.",
            "😂 From Slapstick to Soul: Seamlessly shifts from hilarious screwball comedy to profound social commentary.",
            "🚂 The Church Scene: Contains one of the most moving sequences in cinema history involving a chain gang and a Mickey Mouse cartoon."
        ]
    },
    {
        title: "His Girl Friday",
        metaTitle: "Watch His Girl Friday (1940) • The Fastest Comedy Ever Made",
        metaDescription: "Cary Grant and Rosalind Russell trade barbs at breakneck speed in this definitive screwball comedy set in a chaotic newsroom. 92 minutes of pure adrenaline and wit.",
        whyWatch: [
            "⚡ Lightning Speed Dialogue: Characters speak at 240 words per minute (vs. the average 90). Try to keep up!",
            "🔥 Electric Chemistry: Cary Grant and Rosalind Russell set the standard for on-screen banter.",
            "📰 Newsroom Chaos: Captures the manic energy of old-school journalism like no other film."
        ]
    },
    {
        title: "Arsenic and Old Lace",
        metaTitle: "Watch Arsenic and Old Lace (1944) • Dark Comedy Perfection",
        metaDescription: "Cary Grant discovers his sweet spinster aunts are poisoning lonely old men. A hilarious, macabre farce directed by Frank Capra. The original dark comedy.",
        whyWatch: [
            "😲 Cary Grant's Reaction Shots: Use this movie as a masterclass in physical comedy and double-takes.",
            "🍷 Sweetly Macabre: A unique mix of cozy tea-time atmosphere and serial killing that is laugh-out-loud funny.",
            "🎃 Halloween Vibes: Set on Halloween night, it fits perfectly for spooky season or any comedy night."
        ]
    }
];

async function main() {
    console.log('Optimizing Classics Content...');

    for (const item of CLASSICS_CONTENT) {
        console.log(`Processing ${item.title}...`);

        const { data: current } = await supabase.from('movies').select('data').eq('title', item.title).single();
        if (current) {
            const newData = {
                ...current.data,
                metaTitle: item.metaTitle,
                metaDescription: item.metaDescription,
                seoDescription: item.metaDescription, // Sync
                whyWatch: item.whyWatch
            };

            await supabase.from('movies').update({ data: newData }).eq('title', item.title);
            console.log('✅ Updated Meta & Why Watch');
        } else {
            console.log('❌ Movie not found in DB');
        }
    }
}

main();
