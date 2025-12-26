
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl!, supabaseKey!);

const CLASSICS_DESCRIPTIONS = [
    {
        title: "The Shop Around the Corner",
        description: "Alfred Kralik (James Stewart) and Klara Novak (Margaret Sullavan) are two bickering employees at a Budapest gift shop who can't stand each other. Unbeknownst to them, they are falling deeply in love through anonymous letters, building a romance that exists entirely on paper. As Christmas Eve approaches, the tension in the shop rises, leading to a heartwarming reveal that has defined the romantic comedy genre for nearly a century."
    },
    {
        title: "Sullivan's Travels",
        description: "John L. Sullivan (Joel McCrea) is a wealthy Hollywood director tired of making shallow comedies. Desperate to create a 'serious' film about human suffering, he disguises himself as a hobo and hits the road with a runaway actress (Veronica Lake). But reality hits harder than he expects. Through prison camps and poverty, Sullivan learns a profound lesson: that for those truly suffering, laughter isn't trivial—it's necessary for survival."
    },
    {
        title: "His Girl Friday",
        description: "Star reporter Hildy Johnson (Rosalind Russell) is ready to quit the newspaper business to marry a boring insurance agent and settle down. But her conniving editor and ex-husband, Walter Burns (Cary Grant), isn't letting her go without a fight. He lures her back for one last big scoop—a high-profile execution that turns into a chaotic circus of corruption, hidden fugitives, and rapid-fire wit. The fastest talking comedy ever made."
    },
    {
        title: "Arsenic and Old Lace",
        description: "Drama critic Mortimer Brewster (Cary Grant) has just gotten married, but his honeymoon is put on hold when he makes a horrifying discovery: his sweet, elderly aunts have been poisoning lonely old men with elderberry wine 'out of kindness.' As Mortimer frantically tries to handle the bodies in the cellar, his family's insanity spirals out of control—including a brother who thinks he's Teddy Roosevelt and another who is a fugitive serial killer."
    }
];

async function main() {
    console.log('Updating Classics Descriptions...');

    for (const item of CLASSICS_DESCRIPTIONS) {
        console.log(`Processing ${item.title}...`);

        const { data: current } = await supabase.from('movies').select('data').eq('title', item.title).single();
        if (current) {
            const newData = {
                ...current.data,
                description: item.description
            };

            await supabase.from('movies').update({ data: newData }).eq('title', item.title);
            console.log('✅ Updated Description');
        } else {
            console.log('❌ Movie not found in DB');
        }
    }
}

main();
