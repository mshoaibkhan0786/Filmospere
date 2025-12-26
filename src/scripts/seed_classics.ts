
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const tmdbKey = '8da2d8399f3af98c4d290b2aaacc602e';

if (!supabaseKey) {
    console.error('Missing Supabase Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

const MOVIES_TO_ADD = [
    { title: "The Shop Around the Corner", year: 1940 },
    { title: "Sullivan's Travels", year: 1941 },
    { title: "His Girl Friday", year: 1940 },
    { title: "Arsenic and Old Lace", year: 1944 }
];

async function fetchTmdbData(title: string, year: number) {
    console.log(`Searching for: ${title} (${year})...`);
    // 1. Search
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(title)}&year=${year}`);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
        console.error(`❌ Not found: ${title}`);
        return null;
    }

    const movie = searchData.results[0];
    const movieId = movie.id;

    // 2. Details
    const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbKey}&append_to_response=credits,images,watch/providers,videos`);
    const details = await detailsRes.json();

    return details;
}

function processMovieData(tmdb: any) {
    // Map TMDB to our Schema
    const hours = Math.floor(tmdb.runtime / 60);
    const mins = tmdb.runtime % 60;
    const duration = `${hours}h ${mins}m`;

    // Watch Providers (US + IN Flatrate)
    const providers: any[] = [];
    const regions = ['US', 'IN'];

    if (tmdb['watch/providers'] && tmdb['watch/providers'].results) {
        regions.forEach(region => {
            const data = tmdb['watch/providers'].results[region];
            if (data && data.flatrate) {
                data.flatrate.forEach((p: any) => {
                    providers.push({
                        platform: p.provider_name,
                        url: data.link, // TMDB link
                        icon: `https://image.tmdb.org/t/p/original${p.logo_path}`,
                        country: region,
                        type: 'flatrate'
                    });
                });
            }
        });
    }

    // AI-Style Generation (Mocking the optimization for speed/reliability)
    const aiTitle = `${tmdb.title} (${new Date(tmdb.release_date).getFullYear()}) • A Classic Masterpiece`;
    const aiDesc = `Discover likely the best version of ${tmdb.title}. ${tmdb.overview} Starring ${tmdb.credits.cast[0]?.name} and ${tmdb.credits.cast[1]?.name}.`;

    const whyWatch = [
        `Features a legendary performance by ${tmdb.credits.cast[0]?.name}`,
        "A defining moment in cinema history",
        `Rated ${tmdb.vote_average.toFixed(1)}/10 by thousands of fans`
    ];

    const movieData = {
        id: `tmdb-${tmdb.id}`,
        title: tmdb.title,
        data: {
            title: tmdb.title,
            slug: `${tmdb.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date(tmdb.release_date).getFullYear()}`,
            releaseYear: new Date(tmdb.release_date).getFullYear(),
            releaseDate: tmdb.release_date,
            duration: duration,
            posterUrl: `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`,
            description: tmdb.overview,
            rating: tmdb.vote_average,
            voteCount: tmdb.vote_count,
            genres: tmdb.genres.map((g: any) => g.name),
            tags: tmdb.genres.map((g: any) => g.name),
            cast: tmdb.credits.cast.slice(0, 10).map((c: any) => ({
                id: `tmdb-${c.id}`,
                name: c.name,
                role: c.character,
                imageUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
            })),
            streamingLinks: providers,
            metaTitle: aiTitle,
            metaDescription: aiDesc,
            seoDescription: aiDesc,
            whyWatch: whyWatch,
            backdrop_path: tmdb.backdrop_path,
            images: tmdb.images?.backdrops?.map((b: any) => `https://image.tmdb.org/t/p/original${b.file_path}`).slice(0, 5) || [],
            videos: tmdb.videos?.results?.filter((v: any) => v.site === 'YouTube').slice(0, 2).map((v: any) => ({
                id: v.key,
                title: v.name,
                thumbnailUrl: `https://img.youtube.com/vi/${v.key}/0.jpg`,
                videoUrl: `https://www.youtube.com/watch?v=${v.key}`
            })) || []
        }
    };

    return movieData;
}

async function main() {
    console.log('--- SEEDING CLASSICS ---');

    for (const item of MOVIES_TO_ADD) {
        const tmdbData = await fetchTmdbData(item.title, item.year);
        if (tmdbData) {
            const processed = processMovieData(tmdbData);

            // Insert
            const { error } = await supabase
                .from('movies')
                .upsert(processed);

            if (error) {
                console.error(`Error inserting ${item.title}:`, error);
            } else {
                console.log(`✅ Added: ${item.title} (Slug: ${processed.data.slug})`);
            }
        }
    }
}

main();
