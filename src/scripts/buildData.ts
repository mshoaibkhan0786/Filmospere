// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

import type { Movie, CastMember } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// Helper to fetch ALL movies with pagination
async function fetchAllMovies() {
    let allMovies: Movie[] = [];
    let from = 0;
    const step = 200; // Reduced from 1000 to prevent timeout

    console.log('📡 Fetching movies from Supabase...');

    while (true) {
        const { data, error } = await supabase
            .from('movies')
            .select('id, data')
            .range(from, from + step - 1);

        if (error) {
            console.error('Error fetching movies:', error);
            break;
        }

        if (!data || data.length === 0) break;

        // Transform: { id: '...', data: { ... } } -> { id: '...', ...data }
        // Ensure ID from DB is preserved
        const batch = data.map(row => {
            // Protect against null data
            const movieData = row.data || {};
            return {
                ...movieData,
                id: row.id // Enforce DB ID
            } as Movie;
        });

        allMovies = [...allMovies, ...batch];

        console.log(`   Fetched ${batch.length} rows (Total: ${allMovies.length})`);

        if (data.length < step) break; // Last page
        from += step;
    }

    return allMovies;
}


async function buildData() {
    console.log('Starting data build...');

    // Fetch from Source of Truth (Supabase)
    const tmdbMovies = await fetchAllMovies();
    console.log(`✅ Loaded ${tmdbMovies.length} movies from Supabase.`);

    // Supabase IS the source of truth. No manual merge needed.
    let initialMovies: Movie[] = tmdbMovies;

    // (Merge logic removed as Supabase contains full data)


    // --- CAST NORMALIZATION LOGIC ---
    // Unify cast members. If SRK has an image in Movie A, use it for Movie B.
    const castRegistry = new Map<string, CastMember>();

    // First pass: Build Registry, preferring entries with IMAGES
    initialMovies.forEach(movie => {
        movie.cast?.forEach(member => {
            const existing = castRegistry.get(member.id);
            if (!existing) {
                castRegistry.set(member.id, member);
            } else if (!existing.imageUrl && member.imageUrl) {
                // Upgrade to the version with an image
                castRegistry.set(member.id, member);
            }
        });
    });

    // Second pass: Update all movies to use the "Rich" cast members
    initialMovies = initialMovies.map(movie => ({
        ...movie,
        cast: movie.cast?.map(member => castRegistry.get(member.id) || member) || []
    }));
    // -------------------------------

    // SURGICAL FIX: Remove Game of Thrones and Stranger Things (Clean up legacy hardcodes if needed)
    initialMovies = initialMovies.filter(m =>
        m.id !== 'series-game-of-thrones' &&
        m.id !== 'series-stranger-things'
    );

    // Migration: Update existing movies with invalid vote counts & Money Heist episodes
    let updatedMovies = initialMovies.map(originalMovie => {
        // Remove 'Imported' tag
        const movie = {
            ...originalMovie,
            tags: originalMovie.tags?.filter(t => t !== 'Imported') || []
        };

        const year = movie.releaseYear || new Date().getFullYear();
        const isModern = year > 2010;
        const min = isModern ? 600 : 100;
        const max = isModern ? 1300 : 600;

        // PERMANENT LOGIC: Enforce Moviepedia Vote Scale
        if (!movie.voteCount || movie.voteCount === 0 || movie.voteCount > 2000) {
            const randomVotes = Math.floor(Math.random() * (max - min + 1)) + min;
            movie.voteCount = randomVotes;
        }

        // MIGRATION: Fix Money Heist Views (Reset from 250k ghost data)
        if (movie.id === 'series-money-heist' && movie.views === 250000) {
            movie.views = 0;
        }

        // FIX: Remove Season 0 from Doraemon
        if (movie.title === 'Doraemon') {
            movie.seasons = movie.seasons?.filter(s => s.seasonNumber !== 0) || [];
        }

        // Migration: Money Heist Fix 
        if ((movie.title === 'Money Heist' || movie.title === 'La casa de papel')) {
            const s1 = movie.seasons?.find(s => s.seasonNumber === 1);
            if (!movie.seasons || movie.seasons.length !== 5 || (s1 && s1.episodes.length < 13)) {

                // RE-INSERT FULL EPISODE DATA HERE TO ENSURE IT PERSISTS
                const moneyHeistSeasons = [
                    {
                        seasonNumber: 1,
                        episodes: [
                            { id: crypto.randomUUID(), title: "Do as Planned", duration: "47m", description: "The Professor recruits a young female robber and seven other criminals for a grand heist ending at the Royal Mint of Spain." },
                            { id: crypto.randomUUID(), title: "Lethal Negligence", duration: "41m", description: "Raquel's negotiation with the Professor gets off to a rocky start. Hostages are terrified as the thieves begin printing money." },
                            { id: crypto.randomUUID(), title: "Misfire", duration: "50m", description: "Police grab an image of the face of one of the robbers. Raquel becomes suspicious of the gentleman she meets at a bar." },
                            { id: crypto.randomUUID(), title: "Trojan Horse", duration: "51m", description: "Raquel suffers a personal crisis not helped by her ex-husband. The thieves reveal a Trojan horse to the police." },
                            { id: crypto.randomUUID(), title: "Groundhog Day", duration: "42m", description: "The thieves let a medic team enter the Mint, and an undercover policeman sneaks in with them. Can the Professor stay a step ahead?" },
                            { id: crypto.randomUUID(), title: "The Warm Cold War", duration: "43m", description: "As the police get closer to identifying the Professor, his relationship with Raquel deepens." },
                            { id: crypto.randomUUID(), title: "Cool Instability", duration: "47m", description: "A faction of hostages tries to escape. The Professor races to destroy evidence that could lead the police to him." },
                            { id: crypto.randomUUID(), title: "You Asked for It", duration: "43m", description: "Raquel discovers a detail about the Professor's past. The thieves lose control of the situation inside the Mint." },
                            { id: crypto.randomUUID(), title: "Whoever Keeps Trying It, Gets It", duration: "45m", description: "The Professor races to stop a witness from identifying him. Berlin seeks revenge for his own honor." },
                            { id: crypto.randomUUID(), title: "Masked No Longer", duration: "54m", description: "Raquel enters the Mint to ascertain that all of the hostages are still alive and well. The thieves must unmask to show her." },
                            { id: crypto.randomUUID(), title: "The Head of the Plan", duration: "44m", description: "Angel gets into a car accident. Raquel finds the secret base of operations for the heist." },
                            { id: crypto.randomUUID(), title: "Matter of Efficiency", duration: "43m", description: "Raquel captures the Professor, but she's torn between her duty and her love for him." },
                            { id: crypto.randomUUID(), title: "What We Have Done", duration: "55m", description: "The police close in on the Mint. The thieves fight for their lives in a desperate final stand." }
                        ]
                    },
                    {
                        seasonNumber: 2,
                        episodes: [
                            { id: crypto.randomUUID(), title: "Time's Up", duration: "42m", description: "The police close in on the Professor's identity. Inside the Mint, the thieves struggle to quell a mutiny." },
                            { id: crypto.randomUUID(), title: "Hercules", duration: "41m", description: "Raquel is removed from the case. The Professor must race to save Tokyo from the police." },
                            { id: crypto.randomUUID(), title: "Boom", duration: "40m", description: "The thieves execute a plan to free Tokyo from police custody. Moscow is injured in a shootout." },
                            { id: crypto.randomUUID(), title: "I Have Been Waiting for You", duration: "43m", description: "Raquel rejoins the investigation, but her trust in the Professor is shaken. The thieves make a final push to escape." },
                            { id: crypto.randomUUID(), title: "Against the Ropes", duration: "43m", description: "The police breach the Mint. Berlin stays behind to cover the escape. The gang flees with the money." },
                            { id: crypto.randomUUID(), title: "La Bella Ciao", duration: "43m", description: "The gang reunites in international waters. They have successfully pulled off the greatest heist in history." },
                            { id: crypto.randomUUID(), title: "Sequel", duration: "42m", description: "Life after the heist isn't as simple as they thought it would be." },
                            { id: crypto.randomUUID(), title: "Ambush", duration: "45m", description: "Old enemies resurface to threaten the gang's newfound freedom." },
                            { id: crypto.randomUUID(), title: "Rebellion", duration: "50m", description: "The gang must come out of hiding to save one of their own." }
                        ]
                    },
                    {
                        seasonNumber: 3,
                        episodes: [
                            { id: crypto.randomUUID(), title: "We're Back", duration: "50m", description: "Rio is captured. The Professor gathers the gang to perform a new heist to save him." },
                            { id: crypto.randomUUID(), title: "Aikido", duration: "41m", description: " The Professor initiates the plan to rob the Bank of Spain. Chaos ensues in Madrid." },
                            { id: crypto.randomUUID(), title: "48 Meters Underground", duration: "50m", description: "The gang enters the Bank. They must access the gold vault which is flooded with water." },
                            { id: crypto.randomUUID(), title: "It's Dolphin Time", duration: "44m", description: "The Professor uses technology to avoid detection. Tamayo takes over the negotiation." },
                            { id: crypto.randomUUID(), title: "Boom, Boom, Ciao", duration: "45m", description: "Palermo takes command inside. The police prepare to breach the bank's reinforced doors." },
                            { id: crypto.randomUUID(), title: "Everything Seemed Insignificant", duration: "48m", description: "Flashbacks reveal Berlin's role in the plan. The group faces internal conflict." },
                            { id: crypto.randomUUID(), title: "A Quick Vacation", duration: "45m", description: "The Professor offers a truce to the police, but it is a trap. Rio is tortured." },
                            { id: crypto.randomUUID(), title: "Astray", duration: "49m", description: "Nairobi is targeted by the police inspector Sierra. The gang is pushed to their breaking point." }
                        ]
                    },
                    {
                        seasonNumber: 4,
                        episodes: [
                            { id: crypto.randomUUID(), title: "Game Over", duration: "53m", description: "Nairobi fights for her life. The Professor tries to re-establish control over the heist." },
                            { id: crypto.randomUUID(), title: "Berlin's Wedding", duration: "44m", description: "Flashbacks to Berlin's wedding. Palermo creates chaos inside the bank to regain power." },
                            { id: crypto.randomUUID(), title: "Anatomy Lesson", duration: "44m", description: "The Professor and Marseille try to help the gang from the outside. Sierra interrogates Lisbon." },
                            { id: crypto.randomUUID(), title: "Pasodoble", duration: "52m", description: "Gandia, the bank's security chief, escapes and hunts the gang members one by one." },
                            { id: crypto.randomUUID(), title: "5 Minutes Earlier", duration: "43m", description: "Flashbacks reveal the plan. In the present, Denver and Rio search for Gandia." },
                            { id: crypto.randomUUID(), title: "TKO", duration: "47m", description: "Gandia takes a hostage. The Professor exposes the police's torture of Rio to the public." },
                            { id: crypto.randomUUID(), title: "Strike the Tent", duration: "52m", description: "The police are forced to halt the attack. The gang tries to perform surgery to save a life." },
                            { id: crypto.randomUUID(), title: "The Paris Plan", duration: "60m", description: "The Professor launches 'The Paris Plan' to rescue Lisbon from police custody." }
                        ]
                    },
                    {
                        seasonNumber: 5,
                        episodes: [
                            { id: crypto.randomUUID(), title: "The End of the Road", duration: "49m", description: "The Inspector finds The Professor's hideout. Lisbon enters the Bank of Spain." },
                            { id: crypto.randomUUID(), title: "Do You Believe in Reincarnation?", duration: "51m", description: "The Army engages the gang. The Professor is held captive by Sierra." },
                            { id: crypto.randomUUID(), title: "Welcome to the Spectacle of Life", duration: "50m", description: "Tokyo and the gang fight back against the military squad. Sierra goes into labor." },
                            { id: crypto.randomUUID(), title: "Your Place in Heaven", duration: "52m", description: "Helsinki is trapped. The Professor helps Sierra deliver her baby." },
                            { id: crypto.randomUUID(), title: "Live Many Lives", duration: "55m", description: "Tokyo remembers her past love. She makes a final stand to save her friends." },
                            { id: crypto.randomUUID(), title: "Escape Valve", duration: "52m", description: "The Professor disappears. The rest of the gang tries to extract the gold." },
                            { id: crypto.randomUUID(), title: "Wishful Thinking", duration: "53m", description: "Berlin and Palermo's past flashes back. The gold is moved out of the bank." },
                            { id: crypto.randomUUID(), title: "The Theory of Elegance", duration: "50m", description: "The gang celebrates prematurely. The police discover the gold's location." },
                            { id: crypto.randomUUID(), title: "Pillow Talk", duration: "52m", description: "The Professor surrenders to the bank. Tamayo questions him." },
                            { id: crypto.randomUUID(), title: "A Family Tradition", duration: "63m", description: "The final showdown. The world watches as the heist comes to its conclusion." }
                        ]
                    },
                ];
                movie.seasons = moneyHeistSeasons;
                movie.totalSeasons = "5";
                movie.contentType = 'series';
            }
        }

        return movie;
    });

    // --- SEO SLUG GENERATION ---
    const slugRegistry = new Set<string>();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const generateSlug = (title: string, year: number | undefined) => {
        let base = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, '');     // Trim hyphens

        if (year) base += `-${year}`;

        let slug = base;
        let counter = 1;

        // Ensure uniqueness
        while (slugRegistry.has(slug)) {
            slug = `${base}-${counter}`;
            counter++;
        }

        slugRegistry.add(slug);
        return slug;
    };

    updatedMovies = updatedMovies.map(m => ({
        ...m,
        slug: generateSlug(m.title, m.releaseYear)
    }));

    // Ensure public dir exists
    const publicDir = path.join(__dirname, '../../public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // Generate Slug Map for O(1) lookup
    const slugMap: Record<string, string> = {};
    updatedMovies.forEach(m => { // Changed from initialMovies to updatedMovies for slugMap generation
        if (m.slug) {
            slugMap[m.slug] = m.id;
        }
    });

    console.log(`Writing data to files...`);
    fs.writeFileSync(path.join(publicDir, 'movies.json'), JSON.stringify(updatedMovies, null, 2)); // Changed to updatedMovies
    fs.writeFileSync(path.join(publicDir, 'slugMap.json'), JSON.stringify(slugMap, null, 2)); // Write Slug Map
    // fs.writeFileSync(path.join(publicDir, 'actors.json'), JSON.stringify(actors, null, 2)); // 'actors' is not defined in this scope, commented out to avoid error

    console.log(`Successfully wrote ${updatedMovies.length} movies to ${publicDir}/movies.json`); // Adjusted log message
}

buildData().catch(console.error);
