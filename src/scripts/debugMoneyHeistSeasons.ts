// @ts-nocheck
import 'dotenv/config';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '8da2d8399f3af98c4d290b2aaacc602e';

async function run() {
    console.log('Inspecting Money Heist (ID 71446) Seasons on TMDB...');

    // 1. Fetch Show Details
    const url = `https://api.themoviedb.org/3/tv/71446?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.seasons) {
        console.error('No seasons found!');
        return;
    }

    console.log(`TMDB reports ${data.number_of_seasons} seasons.`);
    console.log('--- Season breakdown ---');
    data.seasons.forEach((s: any) => {
        console.log(`Season ${s.season_number}: "${s.name}" (${s.episode_count} eps)`);
    });
}

run();
