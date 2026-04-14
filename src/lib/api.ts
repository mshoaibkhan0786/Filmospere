import { supabase } from './supabase';
import type { Movie, Article } from '../types';

export const getHomeData = async (): Promise<{ movies: Movie[], sections: any[] }> => {
    // 1. Try Cache First
    const { data: cacheData, error: cacheError } = await supabase
        .from('home_cache')
        .select('content')
        .eq('id', 'home_feed')
        .single();

    if (cacheData && cacheData.content && !cacheError) {
        const rawSections = (cacheData.content as any).sections || [];
        const cachedMovies: Movie[] = [];
        const seenIds = new Set<string>();

        // Normalize sections to ensure every movie object has valid fields (posterUrl, etc.)
        const cachedSections = rawSections.map((section: any) => {
            if (section.data && Array.isArray(section.data)) {
                const cleanedData = section.data.map((m: any) => ({
                    ...m,
                    id: m.id,
                    title: m.title || m.name || m.data?.title || '',
                    // Robust poster fallback: try standard, then TMDB, then first image, then nested
                    posterUrl: m.posterUrl || '',
                    cast: m.cast || [],
                    tags: m.tags || [],
                    rating: m.rating || 0,
                    voteCount: m.voteCount || 0,
                    images: m.images || (m.backdropUrl ? [m.backdropUrl] : []),
                    data: undefined // Clean up
                }));
                return { ...section, data: cleanedData };
            }
            return section;
        });

        // Collect unique movies for the main list
        cachedSections.forEach((section: any) => {
            if (section.data) {
                section.data.forEach((m: Movie) => {
                    if (!seenIds.has(m.id)) {
                        seenIds.add(m.id);
                        cachedMovies.push(m);
                    }
                });
            }
        });

        if (cachedMovies.length > 0) {
            return { movies: cachedMovies, sections: cachedSections };
        }
    }

    // 2. Fallback: Fetch Core Lists
    console.log('⚠️ Home Cache Miss - Fetching from DB');

    try {
        const safeSelect = 'id, data';

        // Execute queries safely
        const [s1, s2, s3] = await Promise.all([
            supabase.from('movies').select(safeSelect).order('data->voteCount', { ascending: false }).limit(50),
            supabase.from('movies').select(safeSelect).order('data->releaseYear', { ascending: false }).order('data->voteCount', { ascending: false }).limit(50),
            supabase.from('movies').select(safeSelect).eq('data->>contentType', 'series').order('data->voteCount', { ascending: false }).limit(50)
        ]);

        // Log errors if any
        if (s1.error) console.error('Trending fetch error:', s1.error.code, s1.error.message, s1.error.details);
        if (s2.error) console.error('Latest fetch error:', s2.error.code, s2.error.message, s2.error.details);
        if (s3.error) console.error('Series fetch error:', s3.error.code, s3.error.message, s3.error.details);

        // Aggregate results
        const allRows = [...(s1.data || []), ...(s2.data || []), ...(s3.data || [])];
        const movies: Movie[] = [];
        const seenIds = new Set<string>();

        allRows.forEach((row: any) => {
            if (!row || !row.data) return;
            if (!seenIds.has(row.id)) {
                seenIds.add(row.id);
                const movieData = row.data || {};

                // Helper to ensure array
                const ensureArray = (arr: any) => Array.isArray(arr) ? arr : [];

                movies.push({
                    ...movieData,
                    id: row.id,
                    posterUrl: (movieData.posterUrl && movieData.posterUrl !== 'N/A') ? movieData.posterUrl : (movieData.poster_path || (movieData.images && movieData.images[0]) || ''),
                    cast: ensureArray(movieData.cast),
                    tags: ensureArray(movieData.tags),
                    images: ensureArray(movieData.images).length > 0 ? ensureArray(movieData.images) : (movieData.backdropUrl ? [movieData.backdropUrl] : []),
                    rating: typeof movieData.rating === 'number' ? movieData.rating : 0,
                    voteCount: typeof movieData.voteCount === 'number' ? movieData.voteCount : 0,
                    certification: movieData.certification || undefined
                });
            }
        });

        // Construct Basic Sections
        const currentYear = new Date().getFullYear();
        const sections = [
            { title: 'Trending Now', data: movies.slice(0, 20) },
            { title: 'Latest Releases', data: movies.filter(m => m.releaseYear === currentYear).slice(0, 20) },
            { title: 'Web Series', data: movies.filter(m => m.contentType === 'series').slice(0, 20) }
        ];

        return { movies, sections };

    } catch (e) {
        console.error('getHomeData failed:', e);
        // Return empty structure to prevent build crash
        return { movies: [], sections: [] };
    }
};

import { cache } from 'react';

// Lite selection for list views to massively save Supabase Egress
export const LITE_SELECT = `
    id,
    title:data->>title,
    slug:data->>slug,
    posterUrl:data->>posterUrl,
    poster_path:data->>poster_path,
    backdropUrl:data->>backdropUrl,
    images:data->images,
    releaseYear:data->>releaseYear,
    duration:data->>duration,
    rating:data->rating,
    voteCount:data->voteCount,
    tags:data->tags,
    isCopyrightFree:data->isCopyrightFree,
    contentType:data->>contentType,
    director:data->>director
`;

export const mapLiteMovie = (row: any): Movie => ({
    id: row.id,
    title: row.title || '',
    slug: row.slug || '',
    posterUrl: row.posterUrl || row.poster_path || (row.images && row.images[0]) || '',
    backdropUrl: row.backdropUrl,
    images: row.images || (row.backdropUrl ? [row.backdropUrl] : []),
    releaseYear: row.releaseYear || '',
    duration: row.duration || '',
    rating: typeof row.rating === 'number' ? row.rating : Number(row.rating) || 0,
    voteCount: typeof row.voteCount === 'number' ? row.voteCount : Number(row.voteCount) || 0,
    tags: row.tags || [],
    isCopyrightFree: row.isCopyrightFree === 'true' || row.isCopyrightFree === true,
    contentType: row.contentType || 'movie',
    director: row.director || '',
    cast: [] // Omitted for bandwidth
} as unknown as Movie);

export const getMovieById = cache(async (rawId: string): Promise<Movie | null> => {
    // console.log('debug: getMovieById called with:', rawId);
    try {
        const id = decodeURIComponent(rawId).trim();

        // Resolve variations
        const normalized = id.toLowerCase().replace(/:/g, '').replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
        const spacedTitle = id.replace(/-/g, ' ');
        const yearMatch = id.match(/-(19|20)\d{2}$/);
        const cleanSlug = yearMatch ? id.substring(0, yearMatch.index) : null;

        // Execute all probable index hits simultaneously to avoid 5x sequential Network RTT latency
        const [exactSlugRes, idRes, normSlugRes, cleanSlugRes, spacedTitleRes, fuzzyTitleRes] = await Promise.all([
            // 1. Try Exact Match (Slug)
            supabase.from('movies').select('*').eq('data->>slug', id).maybeSingle(),
            // 2. Try ID Match
            !id.includes(' ') ? supabase.from('movies').select('*').eq('id', id).maybeSingle() : Promise.resolve({ data: null }),
            // 3. Fallback: Normalize Slug
            id !== normalized ? supabase.from('movies').select('*').eq('data->>slug', normalized).maybeSingle() : Promise.resolve({ data: null }),
            // 4. Fallback: Year Stripped
            cleanSlug ? supabase.from('movies').select('*').eq('data->>slug', cleanSlug).maybeSingle() : Promise.resolve({ data: null }),
            // 5. Fallback: Smarter Title Match
            supabase.from('movies').select('*').ilike('data->>title', spacedTitle).maybeSingle(),
            // 6. Original Fuzzy Title Match
            id !== spacedTitle ? supabase.from('movies').select('*').ilike('data->>title', id).maybeSingle() : Promise.resolve({ data: null }),
        ]);

        // Prioritize results based on accuracy hierarchy
        let data = exactSlugRes.data 
            || idRes.data 
            || normSlugRes.data 
            || cleanSlugRes.data 
            || spacedTitleRes.data 
            || fuzzyTitleRes.data;

        // 7. SERVER-SIDE JSON FILE FALLBACK (Critical for Stability)
        // If DB fails or returns nothing, check local files (public/movies_partX.json)
        // This mimics the client-side backup logic but ensures SSR doesn't 404.
        if (!data) {
            console.warn(`[getMovieById] DB lookup failed for '${id}'. Attempting local JSON fallback...`);
            try {
                const fs = await import('fs');
                const path = await import('path');

                // Check all 3 parts
                for (let i = 1; i <= 3; i++) {
                    const filePath = path.join(process.cwd(), 'public', `movies_part${i}.json`);
                    if (fs.existsSync(filePath)) {
                        const fileContent = fs.readFileSync(filePath, 'utf-8');
                        const movies = JSON.parse(fileContent);

                        // Search in this chunk
                        // Try exact slug, ID, or fuzzy title
                        const found = movies.find((m: any) =>
                            (m.slug === id) ||
                            (m.id === id) ||
                            (m.slug === id.toLowerCase().replace(/ /g, '-')) ||
                            (m.title && m.title.toLowerCase() === id.replace(/-/g, ' ').toLowerCase())
                        );

                        if (found) {
                            console.log(`[getMovieById] Found in local backup (part${i}): ${found.title}`);
                            // Mock the DB response structure
                            data = {
                                id: found.id || id, // Ensure ID exists
                                data: found
                            };
                            break; // Stop looking
                        }
                    }
                }
            } catch (fsErr) {
                console.error('[getMovieById] Local file fallback failed:', fsErr);
            }
        }

        if (!data) {
            console.warn(`getMovieById: Movie not found for id='${id}'`);
            return null;
        }

        const m = data.data as Movie;
        return {
            ...m,
            id: data.id,
            cast: m.cast || [],
            tags: m.tags || [],
            images: m.images || (m.backdropUrl ? [m.backdropUrl] : []),
        };

    } catch (e) {
        console.error('getMovieById failed:', e);
        return null;
    }
});

export const getArticlesByMovieId = async (movieId: string): Promise<any[]> => {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('related_movie_id', movieId)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('getArticlesByMovieId error:', error);
            return [];
        }
        return data || [];
    } catch (e) {
        console.error('getArticlesByMovieId failed:', e);
        return [];
    }
};

export const getRecommendations = async (currentMovie: Movie): Promise<Movie[]> => {
    try {
        if (!currentMovie.tags || currentMovie.tags.length === 0) return [];

        // Strategy: Fetch candidates that share the PRIMARY tag (first tag)
        // This is efficient and ensures high relevance for the base set.
        const primaryTag = currentMovie.tags[0];

        const { data, error } = await supabase
            .from('movies')
            .select(LITE_SELECT)
            .neq('id', currentMovie.id)
            .contains('data', { tags: [primaryTag] })
            .limit(40); // Fetch a pool of candidates

        if (error || !data) {
            console.error('getRecommendations fetch error:', error);
            return [];
        }

        // Map to Movie type
        const candidates = data.map((row: any) => mapLiteMovie(row));

        // Client-side scoring (same as original algorithm)
        return candidates
            .map(m => {
                let score = 0;
                const mTags = m.tags || [];
                const currentTags = currentMovie.tags || [];

                // Detailed Intersection count
                const sharedTags = mTags.filter(tag => currentTags.includes(tag));
                score += sharedTags.length * 3;

                if (m.director && currentMovie.director && m.director === currentMovie.director) score += 5;
                if (m.contentType === currentMovie.contentType) score += 2;

                // Bonus for same exact primary tag (already guaranteed by fetch, but good for scoring relative to others if we expanded fetch)
                if (mTags[0] === currentTags[0]) score += 1;

                return { movie: m, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(item => item.movie);

    } catch (e) {
        console.error('getRecommendations failed:', e);
        return [];
    }
};

export const getMoviesByTag = async (tag: string, start = 0, count = 20): Promise<Movie[]> => {
    try {
        const normalizedTag = tag.toLowerCase().trim();

        // 1. Industry / Language Mapping (Case Insensitive)
        const industryMap: Record<string, string> = {
            'hollywood': 'English',
            'bollywood': 'Hindi',
            'tollywood': 'Telugu',
            'kollywood': 'Tamil',
            'mollywood': 'Malayalam',
            'sandalwood': 'Kannada',
            'punjabi': 'Punjabi',
            'marathi': 'Marathi',
            'bengali': 'Bengali',
            'gujarati': 'Gujarati',
            'korean': 'Korean',
            'japanese': 'Japanese',
            'chinese': 'Chinese'
        };

        const mappedLang = industryMap[normalizedTag];

        const safeSelect = LITE_SELECT;
        let query = supabase
            .from('movies')
            .select(safeSelect)
            .not('data->>posterUrl', 'is', null)
            .neq('data->>posterUrl', '')
            .neq('data->>posterUrl', 'N/A');

        // 2. Logic Branching
        if (tag === 'South Indian' || normalizedTag === 'south indian') {
            query = query.or('data->>language.ilike.%Telugu%,data->>language.ilike.%Tamil%,data->>language.ilike.%Malayalam%,data->>language.ilike.%Kannada%,data->>original_language.ilike.%Telugu%,data->>original_language.ilike.%Tamil%,data->>original_language.ilike.%Malayalam%,data->>original_language.ilike.%Kannada%');
        } else if (normalizedTag === 'discover') {
            query = query
                .not('data->>duration', 'is', null)
                .neq('data->>duration', 'N/A')
                .neq('data->>duration', '');
        } else if (mappedLang) {
            // Case-insensitive language search
            query = query.or(`data->>language.ilike.${mappedLang},data->>original_language.ilike.${mappedLang}`);
        } else if (normalizedTag === 'web series' || normalizedTag === 'series' || normalizedTag === 'web-series') {
            query = query.contains('data', { contentType: 'series' });
        } else if (normalizedTag === 'trending' || normalizedTag === 'popular') {
            query = query.order('data->voteCount', { ascending: false });
        } else if (normalizedTag === 'top-rated' || normalizedTag === 'top rated') {
            query = query
                .not('data->>rating', 'is', null)
                .neq('data->>rating', '0')
                .neq('data->>rating', 'N/A')
                .gte('data->voteCount', 50)
                .order('data->rating', { ascending: false });
        } else if (normalizedTag === 'latest movies & series' || normalizedTag === 'latest' || normalizedTag === 'new-releases' || normalizedTag === 'new releases') {
            query = query.order('data->releaseYear', { ascending: false });
        } else {
            // 3. General Tag Search (Case Insensitive Hack)

            let searchTag = tag;
            // Handle Sci-Fi variants
            if (normalizedTag === 'sci-fi' || normalizedTag === 'science-fiction' || normalizedTag === 'science fiction') {
                // Try both standard TMDB tag 'Science Fiction' and common 'Sci-Fi'
                // Since .contains is strict, we might need an .or() or just pick the most common.
                // Assuming TMDB data: 'Science Fiction' is the standard Genre name.
                searchTag = 'Science Fiction';
            }

            const titleCaseTag = searchTag === 'Science Fiction'
                ? 'Science Fiction'
                : searchTag.charAt(0).toUpperCase() + searchTag.slice(1).toLowerCase();

            // Optimization: Use .contains with the Title Cased tag.
            // This allows Postgres to use the GIN index on 'data' -> 'tags',
            // solving the statement timeout issue while maintaining case correctness
            // (assuming tags are stored in Title Case, which is standard).
            query = query.contains('data', { tags: [titleCaseTag] });
        }

        // Apply Ordering for non-trending/latest/series-specific (if needed)
        // Series might have their own sort, but releaseYear is fine.
        if (normalizedTag !== 'trending' && normalizedTag !== 'latest movies & series' && normalizedTag !== 'latest') {
            query = query.order('data->releaseYear', { ascending: false });
        }

        const { data, error } = await query.range(start, start + count - 1);

        if (error || !data) {
            console.error('getMoviesByTag fetch error:', JSON.stringify(error, null, 2));
            return [];
        }

        return data.map((row: any) => mapLiteMovie(row));

    } catch (e) {
        console.error('getMoviesByTag failed:', e);
        return [];
    }
};

export const searchMovies = async (query: string, offset = 0, limit = 20, type: 'all' | 'title' | 'broad' = 'all'): Promise<{ results: Movie[]; count: number }> => {
    try {
        if (!query.trim()) return { results: [], count: 0 };

        const safeSelect = LITE_SELECT;

        // Initialize promises
        let titleQueryPromise = Promise.resolve({ data: [] as any[], error: null });
        let broadQueryPromise = Promise.resolve({ data: [] as any[], error: null });

        // 1. Title Search (Executes if type is 'all' or 'title')
        if (type === 'all' || type === 'title') {
            titleQueryPromise = supabase
                .from('movies')
                .select(safeSelect)
                .ilike('data->>title', `%${query}%`)
                // .order('data->voteCount', { ascending: false }) // Optional: sort by popularity within titles
                .range(offset, offset + limit - 1) as any;
        }

        // 2. Broad Search (Executes if type is 'all' or 'broad')
        // Only if query length >= 3 to avoid spam
        if ((type === 'all' || type === 'broad') && query.trim().length >= 3) {
            broadQueryPromise = supabase
                .from('movies')
                .select(safeSelect)
                .or(`data->>tags.ilike.%${query}%,data->>director.ilike.%${query}%,data->>cast.ilike.%${query}%`)
                .order('data->voteCount', { ascending: false })
                .range(offset, offset + limit - 1) as any;
        }

        const [titleRes, broadRes] = await Promise.all([titleQueryPromise, broadQueryPromise]);

        const mapMovie = (r: any) => mapLiteMovie(r);

        const titleMovies = titleRes.data ? titleRes.data.map(mapMovie) : [];
        const broadMovies = broadRes.data ? broadRes.data.map(mapMovie) : [];

        // Deduplicate
        const seen = new Set<string>();
        const merged: Movie[] = [];

        [...titleMovies, ...broadMovies].forEach(m => {
            if (!seen.has(m.id)) {
                seen.add(m.id);
                merged.push(m);
            }
        });

        return {
            results: merged.slice(0, limit),
            // Approximation: If we got full page, assume there are more. 
            // This is "infinite scroll friendly" enough.
            count: (titleMovies.length + broadMovies.length) >= limit ? 100 : (titleMovies.length + broadMovies.length)
        };

    } catch (e) {
        console.error('searchMovies failed:', e);
        return { results: [], count: 0 };
    }
};

// TMDB API Configuration - Token from environment variable
const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;

if (!TMDB_READ_TOKEN) {
    throw new Error('TMDB_READ_TOKEN environment variable is not set. Please add it to .env.local');
}

export const getPersonById = async (id: string): Promise<any | null> => {
    try {
        // Helper to extract numeric ID
        const getTmdbId = (fullId: string) => {
            const match = fullId.match(/-(\d+)$/) || fullId.match(/^(\d+)$/);
            return match ? match[1] : null;
        };

        let tmdbId = getTmdbId(id);
        let searchName = '';

        // Handle Director ID format
        if (!tmdbId && id.startsWith('director-')) {
            searchName = decodeURIComponent(id.replace('director-', ''));
            // Try to find director ID via search if mostly unknown
        }

        // 1. Try Supabase 'cast' table (Cache)
        if (tmdbId) {
            const { data: dbCast } = await supabase
                .from('cast')
                .select('*')
                .eq('tmdb_id', `tmdb-person-${tmdbId}`)
                .maybeSingle();

            if (dbCast && (dbCast.biography || dbCast.biography === '')) {
                return {
                    id: tmdbId,
                    name: dbCast.name,
                    biography: dbCast.biography,
                    profile_path: dbCast.image_url,
                    birthday: dbCast.birthday,
                    place_of_birth: dbCast.place_of_birth,
                    known_for_department: dbCast.known_for_department,
                    images: dbCast.images // Assuming we stored this or similar
                };
            }
        }

        // 2. Fetch from TMDB (Enrichment)
        if (!tmdbId && searchName) {
            // Basic Search to resolve ID
            const res = await fetch(`https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(searchName)}`, {
                headers: { Authorization: `Bearer ${TMDB_READ_TOKEN}`, accept: 'application/json' }
            });
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                tmdbId = data.results[0].id.toString();
            }
        }

        if (tmdbId) {
            const res = await fetch(`https://api.themoviedb.org/3/person/${tmdbId}?append_to_response=images,movie_credits,external_ids`, {
                headers: { Authorization: `Bearer ${TMDB_READ_TOKEN}`, accept: 'application/json' }
            });

            if (!res.ok) return null;

            const data = await res.json();
            const images = data.images?.profiles?.map((p: any) => p.file_path) || [];

            // Optional: Trigger background cache update to Supabase here if strict Next.js limitations allow, 
            // but for now just return the fresh data.
            return {
                ...data,
                images,
                external_ids: data.external_ids // Pass this through
            };
        }

        return null;

    } catch (e) {
        console.error('getPersonById failed:', e);
        return null;
    }
};

export const getMoviesByPersonId = async (id: string, start = 0, count = 40): Promise<Movie[]> => {
    try {
        // MATCHING VITE IMPLEMENTATION EXACTLY
        const match = id.match(/-(\d+)$/) || id.match(/^(\d+)$/);
        const targetId = match ? `tmdb-person-${match[1]}` : id;

        console.log(`[SSR] fetchMoviesByPerson: Input=${id}, Target=${targetId}`);

        // Primary Strategy: JSONB Contains (Best for Indexing)
        // Matches exact object structure in the cast array
        let query = supabase
            .from('movies')
            .select(LITE_SELECT)
            .contains('data', { cast: [{ id: targetId }] })
            .order('data->releaseYear', { ascending: false })
            .range(start, start + count - 1);

        let { data, error } = await query;

        if (error) {
            console.warn(`[SSR] Primary fetch failed for ${targetId}. Error:`, error);
        }

        // Fallback: Text Search if Primary returns empty (or error)
        if (!data || data.length === 0) {
            // console.log('[SSR] Attempting fallback text search...');
            const fallbackQuery = supabase
                .from('movies')
                .select(LITE_SELECT)
                .ilike('data->>cast', `%${targetId}%`)
                .order('data->releaseYear', { ascending: false })
                .range(start, start + count - 1);

            const fallbackResult = await fallbackQuery;
            data = fallbackResult.data;
        }

        if (!data) return [];

        return data.map((row: any) => mapLiteMovie(row));

    } catch (e) {
        console.error('getMoviesByPersonId failed:', e);
        return [];
    }
};

export const getMoviesByIds = async (tmdbIds: string[]): Promise<Movie[]> => {
    if (!tmdbIds.length) return [];
    try {
        // We need to match movies where the data->id matches any of the generic TMDB IDs
        // Our DB ID format: 'tmdb-12345' or just '12345' inside data->id?
        // Let's assume data->id stores the numeric ID or string ID.
        // Actually, looking at `getMovieById` (not shown here but inferred), `id` col is unique.
        // But `data->id` is the TMDB ID.

        // We will query where `data->>id` is in the list.
        // Since list can be large, we chunk it or limit it.
        // Slice to first 100 to avoid URL too large error if actor has 500 creds.
        const safeIds = tmdbIds.slice(0, 100);

        const { data, error } = await supabase
            .from('movies')
            .select(LITE_SELECT)
            // Using JSON containment or simple text filter on ID? 
            // Better: use the numeric ID. `data->id` is usually numeric in JSON.
            // Postgres `in` with JSON ->> extraction
            .in('data->>id', safeIds)
            .order('data->>releaseDate', { ascending: false });

        if (error || !data) return [];

        // Map and ensure uniqueness just in case
        return data.map((row: any) => mapLiteMovie(row));

    } catch (e) {
        console.error('getMoviesByIds failed:', e);
        return [];
    }
};

export const getAllArticles = async (limit = 20): Promise<Article[]> => {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('getAllArticles failed:', error);
            return [];
        }
        return data as Article[];
    } catch (e) {
        console.error('getAllArticles exception:', e);
        return [];
    }
};

export const getArticleBySlug = async (slug: string): Promise<Article | null> => {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .maybeSingle();

        if (error) {
            console.error('getArticleBySlug failed:', error);
            return null;
        }

        if (!data) return null;

        const article = data as Article;

        // Fetch related movie slug if needed
        if (article.related_movie_id) {
            const { data: movieData } = await supabase
                .from('movies')
                .select('data')
                .eq('id', article.related_movie_id)
                .maybeSingle();

            if (movieData && movieData.data && movieData.data.slug) {
                // Return a merged object with the movie slug for linking
                return {
                    ...article,
                    movie: { slug: movieData.data.slug }
                };
            }
        }

        return article;
    } catch (e) {
        console.error('getArticleBySlug exception:', e);
        return null;
    }
};
