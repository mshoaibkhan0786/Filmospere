// @ts-nocheck
import { supabase } from './supabase';
import type { Movie, Article } from '../types';

export const getHomeData = async (): Promise<{ movies: Movie[], sections: any[] }> => {
    try {
        // 1. Try Cache First
        const { data: cacheData, error: cacheError } = await supabase
            .from('home_cache')
            .select('content')
            .eq('id', 'home_feed')
            .maybeSingle();

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
    } catch (cacheErr) {
        console.warn('Home cache read error:', cacheErr);
    }

    // 2. Fallback: Fetch Core Lists
    console.log('⚠️ Home Cache Miss - Fetching from DB');

    try {
        const safeSelect = LITE_SELECT;

        // Execute queries safely
        const [s1, s2, s3] = await Promise.all([
            supabase.from('movies').select(safeSelect).order('data->voteCount', { ascending: false }).limit(30),
            supabase.from('movies').select(safeSelect).order('data->releaseYear', { ascending: false }).order('data->voteCount', { ascending: false }).limit(30),
            supabase.from('movies').select(safeSelect).contains('data', { contentType: 'series' }).limit(30)
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
            if (!row) return;
            const mapped = mapLiteMovie(row);
            if (!seenIds.has(mapped.id)) {
                seenIds.add(mapped.id);
                movies.push(mapped);
            }
        });

        // Construct Basic Sections
        const currentYear = new Date().getFullYear();
        const sections = [
            { title: 'Trending Now', data: movies.slice(0, 20) },
            { title: 'Latest Releases', data: movies.filter(m => String(m.releaseYear) === String(currentYear)).slice(0, 20) },
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

// Lite selection for list views to massively save Supabase Egress and memory
export const LITE_SELECT = `
    id,
    title:data->>title,
    slug:data->>slug,
    posterUrl:data->>posterUrl,
    poster_path:data->>poster_path,
    backdropUrl:data->>backdropUrl,
    backdrop_path:data->>backdrop_path,
    images:data->images,
    releaseYear:data->>releaseYear,
    release_date:data->>releaseDate,
    duration:data->>duration,
    rating:data->rating,
    vote_average:data->rating,
    voteCount:data->voteCount,
    overview:data->>description,
    tags:data->tags,
    isCopyrightFree:data->isCopyrightFree,
    contentType:data->>contentType,
    director:data->>director
`;

export const mapLiteMovie = (row: any): Movie => ({
    id: row.id,
    title: row.title || row.data?.title || '',
    slug: row.slug || row.data?.slug || '',
    posterUrl: row.posterUrl || row.poster_path || (row.images && row.images[0]) || row.data?.posterUrl || '',
    backdropUrl: row.backdropUrl || row.backdrop_path || row.data?.backdropUrl,
    images: (row.images || (row.backdropUrl ? [row.backdropUrl] : [])).slice(0, 12),
    releaseYear: row.releaseYear || row.release_date || row.data?.releaseYear || '',
    duration: row.duration || row.data?.duration || '',
    rating: typeof row.rating === 'number' ? row.rating : (typeof row.vote_average === 'number' ? row.vote_average : Number(row.rating) || 0),
    voteCount: typeof row.voteCount === 'number' ? row.voteCount : Number(row.voteCount) || 0,
    tags: row.tags || row.data?.tags || [],
    isCopyrightFree: row.isCopyrightFree === 'true' || row.isCopyrightFree === true || row.data?.isCopyrightFree === true,
    contentType: row.contentType || row.data?.contentType || 'movie',
    director: row.director || row.data?.director || '',
    cast: [] // Omitted for bandwidth and memory
} as unknown as Movie);

export const getMovieById = cache(async (rawId: string): Promise<Movie | null> => {
    try {
        if (!rawId || typeof rawId !== 'string') return null;
        let id = rawId.trim();
        try {
            id = decodeURIComponent(rawId).trim();
        } catch {
            // Fallback to untransformed rawId if decoding fails
        }
        if (!id) return null;

        // Resolve variations
        const normalized = id.toLowerCase().replace(/:/g, '').replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
        const spacedTitle = id.replace(/-/g, ' ');
        const yearMatch = id.match(/-(19|20)\d{2}$/);
        const cleanSlug = yearMatch ? id.substring(0, yearMatch.index) : null;

        // Sequenced lookup (exact indexed hit first) avoids launching 6 heavy queries concurrently
        // Explicitly select 'id, data' instead of 'select(*)' to avoid pulling unwanted table metadata
        let res = await supabase
            .from('movies')
            .select('id, data')
            .eq('data->>slug', id)
            .maybeSingle();

        if (!res?.data && !id.includes(' ')) {
            res = await supabase
                .from('movies')
                .select('id, data')
                .eq('id', id)
                .maybeSingle();
        }

        if (!res?.data && id !== normalized) {
            res = await supabase
                .from('movies')
                .select('id, data')
                .eq('data->>slug', normalized)
                .maybeSingle();
        }

        if (!res?.data && cleanSlug) {
            res = await supabase
                .from('movies')
                .select('id, data')
                .eq('data->>slug', cleanSlug)
                .maybeSingle();
        }

        if (!res?.data) {
            res = await supabase
                .from('movies')
                .select('id, data')
                .ilike('data->>title', spacedTitle)
                .limit(1)
                .maybeSingle();
        }

        const data = res?.data;
        if (!data || !data.data) {
            console.warn(`getMovieById: Movie not found for id='${id}'`);
            return null;
        }

        const m = data.data as Movie;
        return {
            ...m,
            id: data.id,
            // Limit cast and media items to 12 objects to protect the 128 MB isolate from memory exhaustion
            cast: (m.cast || []).slice(0, 12),
            tags: m.tags || [],
            images: (m.images || (m.backdropUrl ? [m.backdropUrl] : [])).slice(0, 12),
            videos: (m.videos || []).slice(0, 6),
        };

    } catch (e) {
        console.error('getMovieById failed:', e);
        return null;
    }
});

export const getArticlesByMovieId = async (movieId: string): Promise<any[]> => {
    try {
        if (!movieId) return [];
        // Explicitly select only UI-needed columns and limit to 6
        const { data, error } = await supabase
            .from('articles')
            .select('id, title, slug, image_url, created_at')
            .eq('related_movie_id', movieId)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(6);

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
        // Limited to 12 candidates to protect Cloudflare 128 MB isolate limit
        const primaryTag = currentMovie.tags[0];

        const { data, error } = await supabase
            .from('movies')
            .select(LITE_SELECT)
            .neq('id', currentMovie.id)
            .contains('data', { tags: [primaryTag] })
            .limit(12);

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

                // Bonus for same exact primary tag
                if (mTags[0] === currentTags[0]) score += 1;

                return { movie: m, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 12)
            .map(item => item.movie);

    } catch (e) {
        console.error('getRecommendations failed:', e);
        return [];
    }
};

export const getMoviesByTag = async (tag: string, start = 0, count = 24): Promise<Movie[]> => {
    try {
        const normalizedTag = tag.toLowerCase().trim();
        const safeCount = Math.min(Math.max(count, 1), 50);

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
        let query: any = (supabase as any)
            .from('movies')
            .select(safeSelect);

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
                searchTag = 'Science Fiction';
            }

            const titleCaseTag = searchTag === 'Science Fiction'
                ? 'Science Fiction'
                : searchTag.charAt(0).toUpperCase() + searchTag.slice(1).toLowerCase();

            query = query.contains('data', { tags: [titleCaseTag] });
        }

        // Apply Ordering for non-trending/latest/series-specific (if needed)
        if (normalizedTag !== 'trending' && normalizedTag !== 'latest movies & series' && normalizedTag !== 'latest') {
            query = query.order('data->releaseYear', { ascending: false });
        }

        const { data, error } = await query.range(start, start + safeCount - 1);

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

export interface CastSearchResult {
    id: string;
    tmdb_id: string;
    name: string;
    image_url?: string;
}

// Optimized Actor/Person search using trigram GIN index on cast(name)
export const searchCast = async (query: string, limit = 5): Promise<CastSearchResult[]> => {
    try {
        const cleanQuery = query.trim();
        // Do not fire queries if query length is less than 2
        if (cleanQuery.length < 2) return [];

        const { data, error } = await supabase
            .from('cast')
            .select('id, tmdb_id, name, image_url')
            .ilike('name', `%${cleanQuery}%`)
            .limit(limit);

        if (error) {
            console.error('searchCast error:', error);
            return [];
        }

        return (data || []) as CastSearchResult[];
    } catch (e) {
        console.error('searchCast failed:', e);
        return [];
    }
};

export const getPersonByName = searchCast;

export const searchMovies = async (
    query: string,
    offset = 0,
    limit = 20,
    type: 'all' | 'title' | 'broad' = 'all'
): Promise<{ results: Movie[]; count: number; actors?: CastSearchResult[] }> => {
    try {
        const cleanQuery = query.trim();
        // 1. Do not fire search queries if query length < 2
        if (cleanQuery.length < 2) {
            return { results: [], count: 0, actors: [] };
        }

        // Enforce safe limit
        const safeLimit = Math.min(Math.max(limit, 1), 50);

        // 2. Movie search matching trigram GIN index on data->>title with LITE_SELECT
        // Ordered by indexed data->>title (avoid unindexed data->voteCount sort and exact row counts to prevent memory spikes)
        const movieTitleQuery = supabase
            .from('movies')
            .select(LITE_SELECT)
            .ilike('data->>title', `%${cleanQuery}%`)
            .order('data->>title', { ascending: true })
            .range(offset, offset + safeLimit - 1);

        // 3. Person/Actor search matching trigram GIN index on cast(name)
        const actorSearchPromise = searchCast(cleanQuery, 5);

        // Run movie title search and actor search concurrently using Promise.all
        const [titleRes, foundActors] = await Promise.all([
            movieTitleQuery,
            actorSearchPromise
        ]);

        const titleMovies = (titleRes.data || []).map((r: any) => mapLiteMovie(r));

        // 4. For movies belonging to a found actor, lookup using getMoviesByPersonId capped to 20 with LITE_SELECT
        let actorMovies: Movie[] = [];
        if (foundActors.length > 0) {
            for (const actor of foundActors.slice(0, 3)) {
                const actorId = actor.tmdb_id || actor.id;
                let movies = await getMoviesByPersonId(actorId, 0, 20);
                if (movies.length === 0 && actor.name) {
                    const byNameRes = await supabase
                        .from('movies')
                        .select(LITE_SELECT)
                        .ilike('data->>cast', `%${actor.name}%`)
                        .range(0, 19);
                    if (byNameRes.data && byNameRes.data.length > 0) {
                        movies = byNameRes.data.map((r: any) => mapLiteMovie(r));
                    }
                }
                actorMovies.push(...movies);
                if (actorMovies.length >= 20) break;
            }
        }

        // Deduplicate and combine
        const seen = new Set<string>();
        const merged: Movie[] = [];

        // If actor matched and no title matches, prioritize actor movies; otherwise title matches first
        const isActorFirst = foundActors.length > 0 && titleMovies.length === 0;
        const primaryList = isActorFirst ? actorMovies : titleMovies;
        const secondaryList = isActorFirst ? titleMovies : actorMovies;

        primaryList.forEach(m => {
            if (!seen.has(m.id)) {
                seen.add(m.id);
                merged.push(m);
            }
        });

        secondaryList.forEach(m => {
            if (!seen.has(m.id)) {
                seen.add(m.id);
                merged.push(m);
            }
        });

        const results = merged.slice(0, safeLimit);

        return {
            results,
            count: results.length,
            actors: foundActors
        };
    } catch (e) {
        console.error('searchMovies failed:', e);
        return { results: [], count: 0, actors: [] };
    }
};

// TMDB API Configuration - Token from environment variable
const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN || '';

if (!TMDB_READ_TOKEN) {
    console.warn('⚠️ TMDB_READ_TOKEN environment variable is not set. TMDB API calls will fail.');
}

export const getPersonById = async (id: string): Promise<any | null> => {
    try {
        if (!id || typeof id !== 'string') return null;
        // Helper to extract numeric ID
        const getTmdbId = (fullId: string) => {
            const match = fullId.match(/-(\d+)$/) || fullId.match(/^(\d+)$/);
            return match ? match[1] : null;
        };

        let tmdbId = getTmdbId(id);
        let searchName = '';

        // Handle Director ID format
        if (!tmdbId && id.startsWith('director-')) {
            try {
                searchName = decodeURIComponent(id.replace('director-', ''));
            } catch {
                searchName = id.replace('director-', '');
            }
            // Try to find director ID via search if mostly unknown
        }

        // 1. Try Supabase 'cast' table (Cache) - explicitly select only UI-needed columns
        if (tmdbId) {
            const { data: dbCast } = await supabase
                .from('cast')
                .select('tmdb_id, name, biography, image_url, birthday, place_of_birth, known_for_department, images')
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
                    images: (dbCast.images || []).slice(0, 12)
                };
            }
        }

        // 2. Fetch from TMDB (Enrichment) with 4-second timeout
        if (!tmdbId && searchName) {
            try {
                // Basic Search to resolve ID
                const res = await fetch(`https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(searchName)}`, {
                    headers: { Authorization: `Bearer ${TMDB_READ_TOKEN}`, accept: 'application/json' },
                    signal: AbortSignal.timeout(4000)
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.results && data.results.length > 0) {
                        tmdbId = data.results[0].id.toString();
                    }
                }
            } catch (err) {
                console.warn('TMDB search person timed out or failed:', err);
            }
        }

        if (tmdbId) {
            try {
                const res = await fetch(`https://api.themoviedb.org/3/person/${tmdbId}?append_to_response=images,movie_credits,external_ids`, {
                    headers: { Authorization: `Bearer ${TMDB_READ_TOKEN}`, accept: 'application/json' },
                    signal: AbortSignal.timeout(4000)
                });

                if (!res.ok) return null;

                const data = await res.json();
                const images = (data.images?.profiles?.map((p: any) => p.file_path) || []).slice(0, 12);

                if (data.movie_credits?.cast) {
                    data.movie_credits.cast = data.movie_credits.cast.slice(0, 12);
                }

                return {
                    ...data,
                    images,
                    external_ids: data.external_ids || {}
                };
            } catch (err) {
                console.warn('TMDB person details fetch timed out or failed:', err);
                return null;
            }
        }

        return null;

    } catch (e) {
        console.error('getPersonById failed:', e);
        return null;
    }
};

export const getMoviesByPersonId = async (id: string, start = 0, count = 20): Promise<Movie[]> => {
    try {
        if (!id || typeof id !== 'string') return [];
        // Cap count to 20 with LITE_SELECT
        const safeCount = Math.min(count, 20);
        const match = id.match(/-(\d+)$/) || id.match(/^(\d+)$/);
        const targetId = match ? `tmdb-person-${match[1]}` : id;

        // Primary Strategy: JSONB Contains (Best for Indexing)
        // Matches exact object structure in the cast array
        let query = supabase
            .from('movies')
            .select(LITE_SELECT)
            .contains('data', { cast: [{ id: targetId }] })
            .order('data->releaseYear', { ascending: false })
            .range(start, start + safeCount - 1);

        let { data, error } = await query;

        if (error) {
            console.warn(`[SSR] Primary fetch failed for ${targetId}. Error:`, error);
        }

        // Fallback: Text Search if Primary returns empty (or error)
        if (!data || data.length === 0) {
            const fallbackQuery = supabase
                .from('movies')
                .select(LITE_SELECT)
                .ilike('data->>cast', `%${targetId}%`)
                .order('data->releaseYear', { ascending: false })
                .range(start, start + safeCount - 1);

            const fallbackResult = await fallbackQuery;
            data = fallbackResult.data;
        }

        if (!data) return [];

        return data.slice(0, safeCount).map((row: any) => mapLiteMovie(row));

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

export const getAllArticles = async (limit = 6): Promise<Article[]> => {
    try {
        const safeLimit = Math.min(limit, 12);
        const { data, error } = await supabase
            .from('articles')
            .select('id, slug, title, excerpt, image_url, author, category, tags, related_movie_id, created_at, is_published')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(safeLimit);

        if (error) {
            console.error('getAllArticles failed:', error);
            return [];
        }
        return (data || []) as Article[];
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
