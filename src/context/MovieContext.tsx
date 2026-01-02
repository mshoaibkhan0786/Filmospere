import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Movie, CastMember } from '../types';
import { supabase } from '../lib/supabase';

import { ConfigContext } from './ConfigContext';

interface MovieContextType {
    movies: Movie[]; // Currently loaded movies (Cache)
    isLoading: boolean;
    getMovie: (id: string) => Movie | undefined; // Sync lookup in cache
    fetchMovieById: (id: string, forceRefresh?: boolean) => Promise<Movie | undefined>; // Async DB fetch
    searchMovies: (query: string, offset?: number, limit?: number) => Promise<{ results: Movie[]; count: number }>; // Async DB search with pagination
    addMovie: (movie: Movie) => Promise<void>;
    updateMovie: (id: string, movie: Partial<Movie>) => Promise<void>;
    deleteMovie: (id: string) => Promise<void>;
    getAllCast: () => CastMember[];
    addToHistory: (movie: Movie) => void;
    fetchMoviesByTag: (tag: string, start?: number, count?: number) => Promise<Movie[]>;
    fetchMoviesByPerson: (id: string, start?: number, count?: number) => Promise<{ movies: Movie[]; totalCount: number }>;
    fetchRelatedMovies: (movie: Movie) => Promise<void>;
    updateCastMember: (member: CastMember) => Promise<void>;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

// Helper for Static Fallback
let localMoviesCache: Movie[] | null = null;
const fetchLocalMovies = async (): Promise<Movie[]> => {
    if (localMoviesCache) return localMoviesCache;

    console.log('[Backup] Attempting to load movies from local backup...');
    let allMovies: Movie[] = [];
    let partIndex = 1;

    try {
        while (true) {
            const fileName = `movies_part${partIndex}.json`;
            const response = await fetch(`/${fileName}`);

            if (!response.ok) {
                // If the first part is missing, assume no backup exists
                if (partIndex === 1) {
                    console.error('[Backup] Failed to load local movies: movies_part1.json not found.');
                    return [];
                }
                // Otherwise, we've loaded all available parts
                break;
            }

            // CHECK: Prevent parsing index.html (SPA fallback) as JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                // We likely hit the SPA fallback for a missing file
                if (partIndex === 1) {
                    console.error('[Backup] Failed to load local movies: Server returned HTML instead of JSON.');
                    return [];
                }
                break;
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                console.error(`[Backup] Failed to parse JSON for ${fileName}`, jsonErr);
                break;
            }
            // Ensure data matches Movie interface
            const chunkMovies = data.map((m: any) => ({
                ...m,
                // Ensure critical fields exist
                cast: m.cast || [],
                tags: m.tags || [],
                rating: m.rating || 0,
                voteCount: m.voteCount || 0
            })) as Movie[];

            allMovies = allMovies.concat(chunkMovies);
            console.log(`[Backup] Loaded ${fileName}, total movies so far: ${allMovies.length}`);
            partIndex++;
        }

        if (allMovies.length === 0) {
            console.error('[Backup] No movie data found in any backup parts.');
            return [];
        }

        localMoviesCache = allMovies;
        console.log(`[Backup] Successfully loaded ${localMoviesCache.length} movies from local backup parts.`);
        return localMoviesCache;

    } catch (e) {
        console.error('[Backup] Failed to load local backup:', e);
        return [];
    }
};

export const MovieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Cache Management: LRU with size limit to prevent memory bloat
    const MAX_CACHE_SIZE = 500;
    // Stores timestamp of last access for LRU eviction
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_cacheAge, setCacheAge] = useState<Map<string, number>>(new Map());

    // Initial Load: Fetch 8 movies for EVERY section to ensure fullness
    const config = useContext(ConfigContext);
    const sections = config?.sections || [];

    // Track last loaded config to prevent double-fetch in StrictMode
    const lastLoadedConfig = React.useRef<string>('');
    const slugMapRef = React.useRef<Record<string, string>>({}); // Slug -> ID Map

    // CRITICAL FEATURE: QUERY CACHING (5 Min TTL) - DO NOT REMOVE
    // Used to prevent DB spam when users navigate back/forth between sections
    const sectionCache = React.useRef<Map<string, { data: Movie[], timestamp: number }>>(new Map());

    // Race Condition Fix: Coordinate Slug Map Loading (Lazy Init to prevent overwrites)
    const resolveSlugMap = React.useRef<() => void>(() => { });
    const slugMapLoaded = React.useRef<Promise<void> | null>(null);
    if (!slugMapLoaded.current) {
        slugMapLoaded.current = new Promise(r => {
            resolveSlugMap.current = r;
        });
    }

    useEffect(() => {
        // Fetch Slug Map (Background)
        fetch('/slugMap.json')
            .then(res => res.json())
            .then(map => {
                slugMapRef.current = map;
                resolveSlugMap.current(); // Signal Ready
                // console.log('✅ Slug Map Loaded');
            })
            .catch(() => {
                resolveSlugMap.current(); // Resolve anyway to unblock
            }); // Silent fail
        const sectionsStr = JSON.stringify(sections);
        // If we already loaded this exact config, skip to prevent "yo-yo" resets
        if (lastLoadedConfig.current === sectionsStr) {
            return;
        }
        lastLoadedConfig.current = sectionsStr;

        const loadInitialMovies = async () => {
            setIsLoading(true);
            try {
                // We need to fetch enough movies to fill every section on the home page with at least 8 items.
                // 1. Identify all unique tags/categories from config
                const tagsToFetch = sections
                    .filter((s: any) => s.type === 'custom' && s.query && s.visible)
                    .map((s: any) => s.query!);

                // 0. CACHE FIRST STRATEGY (Instant Load)
                const { data: cacheData, error: cacheError } = await supabase
                    .from('home_cache')
                    .select('content')
                    .eq('id', 'home_feed')
                    .single();

                if (cacheData && cacheData.content && !cacheError) {
                    // console.log('⚡ Using Cached Home Feed');
                    const cachedSections = (cacheData.content as any).sections || [];
                    const cachedMovies: Movie[] = [];
                    const cachedSeenIds = new Set<string>();

                    cachedSections.forEach((section: any) => {
                        if (section.data) {
                            section.data.forEach((m: any) => {
                                if (!cachedSeenIds.has(m.id)) {
                                    cachedSeenIds.add(m.id);
                                    cachedMovies.push({
                                        id: m.id,
                                        title: m.title,
                                        posterUrl: m.posterUrl,
                                        rating: m.rating,
                                        releaseYear: m.releaseYear,
                                        duration: m.duration,
                                        tags: m.tags,
                                        slug: m.slug,
                                        contentType: m.contentType,
                                        voteCount: m.voteCount,
                                        // Defaults for cached items (lightweight)
                                        cast: [],
                                        streamingLinks: [],
                                        whyWatch: [],
                                        isCopyrightFree: false,
                                        images: m.images || (m.backdropUrl ? [m.backdropUrl] : []),
                                        description: m.description || '',
                                        director: m.director || 'Unknown',
                                        backdropUrl: m.backdropUrl,
                                        views: 0
                                    } as Movie);
                                }
                            });
                        }
                    });

                    if (cachedMovies.length > 0) {
                        setMovies(cachedMovies);
                        setIsLoading(false); // Instant Paint

                        // Trigger Background Lazy Load (Genres)
                        // We duplicate this block here to ensure it runs even when we return early
                        setTimeout(async () => {
                            const genrePromises = tagsToFetch.map(tag => {
                                let searchTag = tag;
                                if (tag === 'Science Fiction') searchTag = 'Sci-Fi';
                                if (tag === 'Sci-Fi') searchTag = 'Science Fiction';

                                return supabase
                                    .from('movies')
                                    .select('id, data->title, data->posterUrl, data->rating, data->releaseYear, data->slug, data->contentType, data->voteCount, data->tags, data->duration, data->description, data->backdropUrl')
                                    .contains('data', { tags: [searchTag] })
                                    .limit(12);
                            });

                            const genreResults = await Promise.all(genrePromises);
                            const lazyMovies: Movie[] = [];

                            genreResults.forEach(res => {
                                if (res.data) {
                                    res.data.forEach((row: any) => {
                                        if (!cachedSeenIds.has(row.id)) {
                                            lazyMovies.push({
                                                ...row,
                                                id: row.id
                                            } as unknown as Movie);
                                            cachedSeenIds.add(row.id);
                                        }
                                    });
                                }
                            });

                            if (lazyMovies.length > 0) {
                                setMovies(prev => {
                                    const existingIds = new Set(prev.map(m => m.id));
                                    const uniqueNew = lazyMovies.filter(m => !existingIds.has(m.id));
                                    return [...prev, ...uniqueNew];
                                });
                            }
                        }, 100);

                        return; // EXIT EARLY - Skip Heavy DB logic
                    }
                }

                // 2. Prepare Fetch Promises (Fallback)
                // Reverting to select('*') to fix 500 Internal Server Errors on Supabase

                // A. Base Popular (Top 50)
                // A. Base Popular (Top 50)
                const p1 = supabase.from('movies')
                    .select('id, data->title, data->posterUrl, data->rating, data->releaseYear, data->slug, data->contentType, data->voteCount, data->tags, data->duration, data->description, data->backdropUrl')
                    .not('data->>posterUrl', 'is', null)
                    .neq('data->>posterUrl', 'N/A')
                    .neq('data->>posterUrl', '')
                    .order('data->voteCount', { ascending: false })
                    .limit(50);

                // B. Latest (Top 50)
                // B. Latest (Top 50)
                const p2 = supabase.from('movies')
                    .select('id, data->title, data->posterUrl, data->rating, data->releaseYear, data->slug, data->contentType, data->voteCount, data->tags, data->duration, data->description, data->backdropUrl')
                    .not('data->>posterUrl', 'is', null)
                    .neq('data->>posterUrl', 'N/A')
                    .neq('data->>posterUrl', '')
                    .order('data->releaseYear', { ascending: false })
                    .limit(50);

                // C. Series (Top 50)
                // C. Series (Top 50)
                const p3 = supabase.from('movies')
                    .select('id, data->title, data->posterUrl, data->rating, data->releaseYear, data->slug, data->contentType, data->voteCount, data->tags, data->duration, data->description, data->backdropUrl')
                    .eq('data->>contentType', 'series')
                    .not('data->>posterUrl', 'is', null)
                    .neq('data->>posterUrl', 'N/A')
                    .neq('data->>posterUrl', '')
                    .limit(50);

                // 3. Execute Core Fetch First (Parallel)
                const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

                if (r1.error || r2.error || r3.error) {
                    throw new Error('Supabase fetch failed'); // Force fallback
                }

                // 4. Gather Core Results
                const newMovies: Movie[] = [];
                const seenIds = new Set<string>();

                const processRows = (rows: any[] | null) => {
                    if (!rows) return;
                    rows.forEach(row => {
                        if (!seenIds.has(row.id)) {
                            seenIds.add(row.id);
                            // Standard full movie object from data column
                            newMovies.push({
                                ...row,
                                id: row.id
                            } as unknown as Movie);
                        }
                    });
                };

                processRows(r1.data);
                processRows(r2.data);
                processRows(r3.data);

                // 5. Initial Paint
                setMovies([...newMovies]);
                // Removed early setIsLoading(false) to prevent UI jump. Waiting for full shuffle.

                // 6. Background Fetch: Get the Genre Sections (Lazy Load)
                setTimeout(async () => {
                    try {
                        const genrePromises = tagsToFetch.map(tag => {
                            let searchTag = tag;
                            if (tag === 'Science Fiction') searchTag = 'Sci-Fi';
                            if (tag === 'Sci-Fi') searchTag = 'Science Fiction';

                            return supabase
                                .from('movies')
                                .select('id, data->title, data->posterUrl, data->rating, data->releaseYear, data->slug, data->contentType, data->voteCount, data->tags, data->duration, data->description, data->backdropUrl')
                                .ilike('data->>tags', `%${searchTag}%`)
                                .limit(12);
                        });

                        const genreResults = await Promise.all(genrePromises);
                        const lazyMovies: Movie[] = [];

                        genreResults.forEach(res => {
                            if (res.data) {
                                res.data.forEach((row: any) => {
                                    if (!seenIds.has(row.id)) {
                                        lazyMovies.push({
                                            ...row,
                                            id: row.id
                                        } as unknown as Movie);
                                        seenIds.add(row.id);
                                    }
                                });
                            }
                        });

                        // Update State with Genre Movies (Deduplicated)
                        if (lazyMovies.length > 0) {
                            setMovies(prev => {
                                const existingIds = new Set(prev.map(m => m.id));
                                const uniqueNew = lazyMovies.filter(m => !existingIds.has(m.id));
                                return [...prev, ...uniqueNew];
                            });
                        }
                    } catch (ignored) {
                        // Silent fail for background fetch, fallback data is already enough
                    }
                    // Background load finished - NOW we unblock UI to show the final shuffled state
                    setIsLoading(false);
                }, 100);

            } catch (err) {
                console.warn('[MovieContext] Supabase failed, switching to STATIC FALLBACK:', err);
                const localData = await fetchLocalMovies();
                if (localData.length > 0) {
                    // Random shuffle or slice for home page variety
                    const shuffled = [...localData].sort(() => 0.5 - Math.random()).slice(0, 100);
                    setMovies(shuffled);
                }
                setIsLoading(false);
            }
        };

        loadInitialMovies();
    }, [sections]); // Re-run if sections config changes


    // Sync lookup (checks currently loaded movies)
    const getMovie = useCallback((identifier: string) => {
        return movies.find(m => m.id === identifier || m.slug === identifier);
    }, [movies]);

    // Async DB fetch (for MoviePage when movie is not in Top 100)
    const fetchMovieById = useCallback(async (identifier: string, forceRefresh = false): Promise<Movie | undefined> => {
        // Check cache first (unless forced)
        const cached = movies.find(m => m.id === identifier || m.slug === identifier);

        // Smart Cache Usage: Only use cache if it has detailed info (Director AND Description AND Cast)
        const isDetailed = cached &&
            cached.director && cached.director !== 'Unknown' &&
            cached.description && cached.description.length > 0 &&
            (cached.cast && cached.cast.length > 0); // Crucial: Home Cache often has empty cast

        if (cached && isDetailed && !forceRefresh) return cached;

        try {
            // Try ID first
            let { data, error } = await supabase
                .from('movies')
                .select('id, data')
                .eq('id', identifier)
                .maybeSingle();

            // If not found by ID, try finding by Slug
            if (error || !data) {
                // Wait for map to load (Race Condition Fix)
                await slugMapLoaded.current;

                // FAST LOOKUP: Check Slug Map first (O(1))
                let mappedId = slugMapRef.current?.[identifier];

                // Normalization Fallback (Spaces -> Hyphens)
                if (!mappedId && identifier.includes(' ')) {
                    const normalized = identifier.toLowerCase().replace(/ /g, '-');
                    mappedId = slugMapRef.current?.[normalized];
                }

                if (mappedId) {
                    // console.log(`[MovieContext] Slug Map Hit: ${identifier} -> ${mappedId}`);
                    // Use existing recursive call or direct DB fetch by ID
                    const result = await fetchMovieById(mappedId, forceRefresh);

                    // Critical Fix: Ensure Slug Persists in Cache
                    // If we fetched by ID but the caller used a Slug, trace it back.
                    if (result && !result.slug && identifier !== mappedId) {
                        result.slug = identifier;

                        // Update cache with the slug-enriched version
                        setMovies(prev => {
                            const filtered = prev.filter(m => m.id !== result.id);
                            return [...filtered, result];
                        });
                    }
                    return result;
                }

                // Fallback: Slow JSON Scan (only if not in map AND normalization failed)
                const { data: slugData } = await supabase
                    .from('movies')
                    .select('id, data')
                    .eq('data->>slug', identifier)
                    .single();

                if (slugData) {
                    data = slugData;
                    error = null;
                }
            }

            if (error || !data) {
                console.warn('[MovieContext] Fetch failed for:', identifier, error);
                throw new Error('Not found in DB'); // Trigger fallback
            }

            const movie = { ...data.data, id: data.id } as Movie;
            // Movie fetched successfully
            // Update cache: remove old version if exists, then add new one
            setMovies(prev => {
                const filtered = prev.filter(m => m.id !== movie.id);
                return [...filtered, movie];
            });
            return movie;
        } catch (err) {
            console.warn('[MovieContext] Falling back to local for:', identifier);
            // Fallback Logic
            const localData = await fetchLocalMovies();
            const found = localData.find(m => m.id === identifier || m.slug === identifier);

            // Normalized Fallback
            if (!found && identifier.includes(' ')) {
                const normalized = identifier.toLowerCase().replace(/ /g, '-');
                const foundNorm = localData.find(m => m.slug === normalized || m.id === normalized);
                if (foundNorm) return foundNorm;
            }

            return found;
        }
    }, [movies]);

    const searchMovies = useCallback(async (rawQuery: string, offset: number = 0, limit: number = 42): Promise<{ results: Movie[]; count: number }> => {
        const query = rawQuery.trim();
        if (!query) return { results: [], count: 0 };

        try {
            // Priority 1: Smart Client-Side Search (Single Query)
            // Uses .or() to search Title, Tags, and Director.
            // rely on voteCount sorting to surface popularity.
            // This ensures consistent pagination (no offset skipping bugs).

            // Priority 1: Hybrid Search Strategy (Title Priority + Broad Context)

            // Query A: Title Matches (The "Seek" Query) - Finds exact/partial title matches regardless of popularity
            const titleQuery = supabase
                .from('movies')
                .select('*')
                .ilike('title', `%${query}%`)
                .limit(50); // Fetch enough to cover reasonable title matches

            // Query B: Broad Matches (The "Browse" Query) - Finds relevant tags/cast/director, sorted by popularity
            const broadQuery = supabase
                .from('movies')
                .select('*')
                .or(`data->>tags.ilike.%${query}%,data->>director.ilike.%${query}%,data->>cast.ilike.%${query}%`)
                .order('data->voteCount', { ascending: false })
                .limit(100); // Fetch enough popular results

            // execute parallel
            const [titleRes, broadRes] = await Promise.all([titleQuery, broadQuery]);

            if (titleRes.error) throw titleRes.error;
            if (broadRes.error) throw broadRes.error;

            const titleMovies = titleRes.data ? titleRes.data.map(r => ({ ...r.data, id: r.id } as Movie)) : [];
            const broadMovies = broadRes.data ? broadRes.data.map(r => ({ ...r.data, id: r.id } as Movie)) : [];

            // Merge & Deduplicate
            const seen = new Set<string>();
            const merged: Movie[] = [];

            // Add Title Matches FIRST
            titleMovies.forEach(m => {
                if (!seen.has(m.id)) {
                    seen.add(m.id);
                    merged.push(m);
                }
            });

            // Add Broad Matches NEXT
            broadMovies.forEach(m => {
                if (!seen.has(m.id)) {
                    seen.add(m.id);
                    merged.push(m);
                }
            });

            // Optional: Advanced Sorting within the Title group
            // We want "Ligaw" (Exact) -> "Ligaw na ..." (Starts With) -> "... Ligaw" (Contains)
            // But preserving the initial fetch order (which was just basic ilike) might be inconsistent
            // Let's do a client-side sort to be sure.

            const lowerQ = query.toLowerCase();
            merged.sort((a, b) => {
                const aTitle = a.title.toLowerCase();
                const bTitle = b.title.toLowerCase();

                const aExact = aTitle === lowerQ;
                const bExact = bTitle === lowerQ;
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;

                const aStarts = aTitle.startsWith(lowerQ);
                const bStarts = bTitle.startsWith(lowerQ);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                // If both match title criteria equally (or neither do), rely on existing order (Broad matches are already pop-sorted)
                // However, Title matches from DB aren't vote-sorted by default, so we might want to sort them by votes secondary?
                // For now, let's trust the "Title First" bucket logic.
                return 0;
            });

            // Pagination Slice
            const pagedResults = merged.slice(offset, offset + limit);

            return { results: pagedResults, count: merged.length };

        } catch (err) {
            console.warn('Smart Search failed, using Fallback:', err);
            // FALLBACK SEARCH
            const localData = await fetchLocalMovies();
            const q = query.toLowerCase();

            const matches = localData.filter(m => {
                return m.title.toLowerCase().includes(q) ||
                    m.tags?.some(t => t.toLowerCase().includes(q)) ||
                    m.director?.toLowerCase().includes(q);
            });

            // Sort by popularity
            matches.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

            return {
                results: matches.slice(offset, offset + limit),
                count: matches.length
            };
        }
    }, []);

    const addMovie = async (movie: Movie) => {
        // Optimistic Update
        setMovies(prev => [movie, ...prev]);

        // DB Update
        const row = {
            id: movie.id,
            title: movie.title,
            data: movie,
            updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('movies').upsert(row);
        if (error) {
            console.error('Failed to add movie to DB:', error);
            // Rollback? For now, just log.
        }
    };

    const updateMovie = async (id: string, updates: Partial<Movie>) => {
        setMovies(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));

        // We need the full object to update the JSON column properly
        // In a real app, we might patch just the fields, but Supabase JSONB merge is tricky.
        // Simplest: Fetch current, merge, save.
        // Or usage of State is "Source of Truth" for the merge:
        const currentRef = movies.find(m => m.id === id);
        if (currentRef) {
            const newItem = { ...currentRef, ...updates };
            const row = {
                id: newItem.id,
                title: newItem.title,
                data: newItem,
                updated_at: new Date().toISOString()
            };
            await supabase.from('movies').upsert(row);
        }
    };

    const deleteMovie = async (id: string) => {
        setMovies(prev => prev.filter(m => m.id !== id));
        await supabase.from('movies').delete().eq('id', id);
    };

    // Best effort Cast for loaded movies
    const getAllCast = useCallback(() => {
        const castMap = new Map<string, CastMember>();
        movies.forEach(movie => {
            movie.cast?.forEach(member => {
                if (!castMap.has(member.id)) {
                    castMap.set(member.id, member);
                }
            });
        });
        return Array.from(castMap.values());
    }, [movies]);

    // Reuse existing history logic
    const addToHistory = (movie: Movie) => {
        try {
            // 1. Track Genres
            const storedGenres = localStorage.getItem('userGenrePreferences');
            const genrePrefs: Record<string, number> = storedGenres ? JSON.parse(storedGenres) : {};
            movie.tags?.forEach(tag => {
                genrePrefs[tag] = (genrePrefs[tag] || 0) + 1;
            });
            localStorage.setItem('userGenrePreferences', JSON.stringify(genrePrefs));

            // 2. Track Languages (Weighted)
            // 'language' field might be "English, Hindi" or just "English"
            if (movie.language && movie.language !== 'N/A' && movie.language !== 'Unknown') {
                const storedLangs = localStorage.getItem('userLanguagePreferences');
                const langPrefs: Record<string, number> = storedLangs ? JSON.parse(storedLangs) : {};

                // Split comma-separated languages
                const langs = movie.language.split(',').map(l => l.trim());
                langs.forEach(lang => {
                    if (lang) langPrefs[lang] = (langPrefs[lang] || 0) + 1;
                });
                localStorage.setItem('userLanguagePreferences', JSON.stringify(langPrefs));
            }

            // 3. Recent History
            const recentStored = localStorage.getItem('recentlyViewedIds');
            let recent: string[] = recentStored ? JSON.parse(recentStored) : [];
            recent = [movie.id, ...recent.filter(id => id !== movie.id)].slice(0, 20);
            localStorage.setItem('recentlyViewedIds', JSON.stringify(recent));
        } catch (e) {
            console.warn('Failed to update user history', e);
        }
    };

    const fetchMoviesByTag = useCallback(async (tag: string, start = 0, count = 20): Promise<Movie[]> => {
        try {
            const normalizedTag = tag.toLowerCase();

            // ⚡ CACHE CHECK (5 Minute TTL)
            const cacheKey = `${normalizedTag}-${start}`;
            const cached = sectionCache.current.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < 300000)) {
                return cached.data;
            }

            // Industry / Language Mapping
            const industryMap: Record<string, string> = {
                'Hollywood': 'English',
                'Bollywood': 'Hindi',
                'Tollywood': 'Telugu',
                'Kollywood': 'Tamil',
                'Mollywood': 'Malayalam',
                'Sandalwood': 'Kannada',
                'Punjabi': 'Punjabi',
                'Marathi': 'Marathi',
                'Bengali': 'Bengali',
                'Gujarati': 'Gujarati',
                'Korean': 'Korean',
                'Japanese': 'Japanese',
                'Chinese': 'Chinese'
            };

            const mappedLang = industryMap[tag] || industryMap[Object.keys(industryMap).find(k => k.toLowerCase() === normalizedTag) || ''];

            let query = supabase
                .from('movies')
                .select('id, data->title, data->posterUrl, data->rating, data->releaseYear, data->slug, data->contentType, data->voteCount, data->tags, data->duration, data->description, data->backdropUrl')
                .not('data->>posterUrl', 'is', null)
                .neq('data->>posterUrl', '')
                .neq('data->>posterUrl', 'N/A');

            if (tag === 'South Indian') {
                query = query.or('data->>language.ilike.%Telugu%,data->>language.ilike.%Tamil%,data->>language.ilike.%Malayalam%,data->>language.ilike.%Kannada%,data->>original_language.ilike.%Telugu%,data->>original_language.ilike.%Tamil%,data->>original_language.ilike.%Malayalam%,data->>original_language.ilike.%Kannada%');
            } else if (normalizedTag === 'discover') {
                // Discover: Show all movies, just filter valid ones (already done by base query)
                query = query
                    .not('data->>duration', 'is', null)
                    .neq('data->>duration', 'N/A')
                    .neq('data->>duration', '');
            } else if (mappedLang) {
                query = query.or(`data->>language.ilike.${mappedLang},data->>original_language.ilike.${mappedLang}`);
            } else if (normalizedTag === 'web series' || normalizedTag === 'series') {
                query = query.eq('data->>contentType', 'series');
            } else if (normalizedTag === 'trending') {
                query = query.order('data->voteCount', { ascending: false }).limit(200);
            } else if (normalizedTag === 'latest movies & series' || normalizedTag === 'latest') {
                // No extra filters, just order by year below
            } else {
                // General Tag Search
                query = query.contains('data', { tags: [tag] });
            }

            // Apply Ordering
            // Note: Trending has its own order logic above/below
            if (normalizedTag !== 'trending') {
                query = query.order('data->releaseYear', { ascending: false });
            }

            const { data, error } = await query.range(start, start + count - 1);

            if (error) {
                throw error; // Trigger fallback
            }

            if (data) {
                let newMovies = data.map(row => ({ ...row, id: row.id } as unknown as Movie));

                // Client-side additional sorts if needed (e.g. Trending combined sort)
                if (normalizedTag === 'trending') {
                    newMovies.sort((a, b) => {
                        const yearA = parseInt(String(a.releaseYear || '0'));
                        const yearB = parseInt(String(b.releaseYear || '0'));
                        return yearB - yearA;
                    });
                }

                setMovies(prev => {
                    const currentMap = new Map(prev.map(m => [m.id, m]));
                    let changed = false;
                    newMovies.forEach(m => {
                        if (!currentMap.has(m.id)) {
                            currentMap.set(m.id, m);
                            changed = true;
                        }
                    });

                    // Update access timestamps
                    setCacheAge(prevAge => {
                        const next = new Map(prevAge);
                        newMovies.forEach(m => next.set(m.id, Date.now()));
                        return next;
                    });

                    // Simple Cache Eviction Logic
                    const allMovies = Array.from(currentMap.values());
                    if (allMovies.length > MAX_CACHE_SIZE) {
                        // Keep most recently accessed
                        return allMovies.slice(-MAX_CACHE_SIZE);
                    }

                    return changed ? allMovies : prev;
                });

                // Cache Result
                sectionCache.current.set(cacheKey, { data: newMovies, timestamp: Date.now() });
                return newMovies;
            }
            return [];

        } catch (err) {
            console.warn(`[MovieContext] DB Tag Fetch Failed for ${tag}, using Fallback`, err);
            const localData = await fetchLocalMovies();

            let results: Movie[] = [];
            const normalizedTag = tag.toLowerCase();

            // Fallback Filtering Logic
            if (normalizedTag === 'trending') {
                results = [...localData].sort((a, b) => {
                    const yearA = parseInt(String(a.releaseYear || '0'));
                    const yearB = parseInt(String(b.releaseYear || '0'));
                    return (yearB - yearA) + ((b.voteCount || 0) - (a.voteCount || 0));
                }).slice(start, start + count);
            } else if (normalizedTag === 'latest' || normalizedTag.includes('latest')) {
                results = [...localData].sort((a, b) => {
                    const yearA = parseInt(String(a.releaseYear || '0'));
                    const yearB = parseInt(String(b.releaseYear || '0'));
                    return yearB - yearA;
                }).slice(start, start + count);
            } else if (normalizedTag === 'web series' || normalizedTag === 'series') {
                results = localData.filter(m => m.contentType === 'series').slice(start, start + count);
            } else if (tag === 'South Indian') {
                // Fallback: South Indian Languages
                const southLangs = ['Telugu', 'Tamil', 'Malayalam', 'Kannada'];
                results = localData.filter(m =>
                    southLangs.some(lang => m.language?.includes(lang) || m.original_language?.includes(lang))
                ).slice(start, start + count);
            } else if (normalizedTag === 'discover') {
                // Fallback: All Movies (paginated)
                results = localData.slice(start, start + count);
            } else {
                // General Tag Match
                // Industry Map for Fallback
                const industryMap: Record<string, string> = {
                    'Hollywood': 'English',
                    'Bollywood': 'Hindi',
                    'Tollywood': 'Telugu',
                    'Kollywood': 'Tamil',
                    'Mollywood': 'Malayalam',
                    'Sandalwood': 'Kannada',
                };
                const lang = industryMap[tag];

                results = localData.filter(m => {
                    // Tag Match
                    if (m.tags?.some(t => t.toLowerCase() === normalizedTag)) return true;
                    // Language Match (if industry)
                    if (lang && m.language?.includes(lang)) return true;
                    return false;
                }).slice(start, start + count);
            }

            return results;
        }
    }, []);

    const fetchMoviesByPerson = useCallback(async (id: string, start = 0, count = 40): Promise<{ movies: Movie[]; totalCount: number }> => {
        try {
            // Fetching by person

            // 1. Identify Candidate IDs (Handle aliases like aaa-person, slugs like name-id, etc.)
            const candidateIds = new Set<string>([id]);
            // Match last numeric part: "shah-rukh-khan-12345" -> "12345"
            // Also handles "tmdb-person-12345" -> "12345"
            const match = id.match(/-(\d+)$/) || id.match(/^(\d+)$/);
            if (match) {
                const numId = match[1];
                candidateIds.add(`Number:${numId}`); // Marker for manual filter if needed, or:
                candidateIds.add(`aaa-person-${numId}`);
                candidateIds.add(`tmdb-person-${numId}`);
                candidateIds.add(`person-${numId}`);
                candidateIds.add(`cast-${numId}`);
                candidateIds.add(numId);
            }

            // Filter out director IDs from this alias logic if they don't match pattern, 
            // but keep the ID itself. 
            // If strictly director:
            if (id.startsWith('director-')) {
                // Director logic remains simple for now
                const directorName = decodeURIComponent(id.replace('director-', ''));
                const { data, count: total } = await supabase
                    .from('movies')
                    .select('*', { count: 'exact' })
                    .ilike('data->>director', `%${directorName}%`)
                    .order('data->>releaseYear', { ascending: false })
                    .range(start, start + count - 1);

                return {
                    movies: data ? data.map(d => d.data as Movie) : [],
                    totalCount: total || 0
                };
            }

            // 2. Optimized Fetch: Only query for the specific ID provided
            // We have standardized on 'tmdb-person-' so we trust the input ID.
            // Spawning 5 parallel queries for legacy aliases (aaa-, cast-, etc.) causes 500 errors (DB timeout).

            // Assuming the DB stores IDs as 'tmdb-person-NUM' or just NUM?
            // "contains" query needs to match exactly what is in the JSON.
            // If DB has "tmdb-person-35742", checking "shah-rukh-khan-35742" fails.

            // We'll search for the numeric ID if extracted, or rely on loose match if we can't tell.
            // But 'contains' on JSON needs exact string match for array items.

            // Revert to old behavior: if we found a numeric ID, check for standard variations.
            // OR simpler: query for "tmdb-person-NUM" if we found a NUM.

            const targetId = match ? `tmdb-person-${match[1]}` : id;
            console.log(`[MovieContext] fetchMoviesByPerson: Input=${id}, Target=${targetId}`);

            // Primary Strategy: JSONB Contains (Best for Indexing)
            let query = supabase
                .from('movies')
                .select('*', { count: 'exact' })
                .contains('data', { cast: [{ id: targetId }] })
                .order('data->releaseYear', { ascending: false })
                .range(start, start + count - 1);

            let { data, error, count: total } = await query;

            if (error) {
                console.warn(`[MovieContext] Primary fetch failed for ${targetId}. Error:`, error);
                console.log('[MovieContext] Attempting fallback text search...');

                // Fallback Strategy: Text Search on JSON String (Slower but robust)
                const fallbackQuery = supabase
                    .from('movies')
                    .select('*', { count: 'exact' })
                    .ilike('data->>cast', `%${targetId}%`)
                    .order('data->releaseYear', { ascending: false })
                    .range(start, start + count - 1);

                const fallbackResult = await fallbackQuery;
                data = fallbackResult.data;
                error = fallbackResult.error;
                total = fallbackResult.count;
            }

            if (error) {
                console.error('[MovieContext] Fallback fetch also failed:', error);
                throw error;
            }

            const mergedMovies: Movie[] = data ? data.map(d => ({ ...d.data, id: d.id } as Movie)) : [];
            const estimatedTotal = total || 0;

            // Skip the complexity of merging multiple result sets since we only have one now.
            // The following logic for aliases is removed for performance.

            // 4. Update State
            setMovies(prev => {
                const currentMap = new Map(prev.map(m => [m.id, m]));
                let changed = false;
                mergedMovies.forEach(m => {
                    if (!currentMap.has(m.id) || JSON.stringify(currentMap.get(m.id)) !== JSON.stringify(m)) {
                        currentMap.set(m.id, m);
                        changed = true;
                    }
                });
                return changed ? Array.from(currentMap.values()) : prev;
            });

            // Re-sort merged slice (even though DB sorted, merging ensures consistency if we had pagination)
            mergedMovies.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));

            return { movies: mergedMovies, totalCount: estimatedTotal };



        } catch (e) {
            console.error(e);
            return { movies: [], totalCount: 0 };
        }
    }, []);

    const fetchRelatedMovies = useCallback(async (movie: Movie) => {
        if (!movie) return;

        // Fetching related movies
        const promises: Promise<any>[] = [];

        // 1. Cast Members (Top 2)
        if (movie.cast) {
            movie.cast.slice(0, 2).forEach(member => {
                if (member.id) {
                    promises.push(fetchMoviesByPerson(member.id, 0, 10));
                }
            });
        }

        // 2. Industry (Specific Tag)
        const INDUSTRIES = ['Bollywood', 'Tollywood', 'Hollywood', 'Anime', 'K-Drama', 'Mollywood', 'Kollywood'];
        const industry = movie.tags?.find(t => INDUSTRIES.includes(t));
        if (industry) {
            promises.push(fetchMoviesByTag(industry, 0, 10));
        }

        // 3. Primary Genre (for More X Movies & Recommendations)
        if (movie.tags && movie.tags.length > 0) {
            const genre = movie.tags[0];
            // Fetch a bit more for genre as it powers recommendations
            promises.push(fetchMoviesByTag(genre, 0, 20));
        }

        // 4. Language (Broad Search)
        if (movie.language) {
            const primaryLang = movie.language.split(',')[0].trim();
            if (primaryLang) {
                promises.push(
                    (async () => {
                        const { data } = await supabase.from('movies')
                            .select('*')
                            .ilike('data->>language', `%${primaryLang}%`)
                            .order('data->voteCount', { ascending: false })
                            .limit(15);

                        if (data) {
                            const newMovies = data.map(d => ({ ...d.data, id: d.id } as Movie));
                            setMovies(prev => {
                                const currentMap = new Map(prev.map(m => [m.id, m]));
                                let changed = false;
                                newMovies.forEach(m => {
                                    if (!currentMap.has(m.id)) {
                                        currentMap.set(m.id, m);
                                        changed = true;
                                    }
                                });
                                return changed ? Array.from(currentMap.values()) : prev;
                            });
                        }
                    })()
                );
            }
        }

        try {
            await Promise.allSettled(promises);
        } catch (err) {
            console.error('[MovieContext] Error fetching related movies:', err);
        }
    }, [fetchMoviesByPerson, fetchMoviesByTag]);

    const updateCastMember = async (member: CastMember) => {
        console.warn('updateCastMember not implemented yet', member);
    };

    return (
        <MovieContext.Provider value={{
            movies,
            isLoading,
            getMovie,
            fetchMovieById,
            searchMovies,
            addMovie,
            updateMovie,
            deleteMovie,
            getAllCast,
            addToHistory,
            fetchMoviesByTag,
            fetchMoviesByPerson,
            fetchRelatedMovies,
            updateCastMember
        }}>
            {children}
        </MovieContext.Provider>
    );
};

export const useMovies = () => {
    const context = useContext(MovieContext);
    if (context === undefined) {
        throw new Error('useMovies must be used within a MovieProvider');
    }
    return context;
};
