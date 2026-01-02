import React, { useMemo, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovies } from '../context/MovieContext';
import MovieCard from '../components/MovieCard';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import PersonSkeleton from '../components/PersonSkeleton';
import { User, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '../components/Footer';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { supabase } from '../lib/supabase';
import { fetchPersonDetails, searchPerson } from '../services/tmdb';
import type { ActorDetails, CastMember } from '../types';

import { cachePersonDetails } from '../services/personCache';

// ... (existing imports)

// ...

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
};

const PersonPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { movies, isLoading, fetchMoviesByPerson } = useMovies();
    const [displayLimit, setDisplayLimit] = useState(30);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [actorsCache, setActorsCache] = useState<Record<string, ActorDetails> | null>(null);
    const [directorMap, setDirectorMap] = useState<Record<string, string> | null>(null);
    const [isScrolled] = useState(false);
    const [isBackHovered, setIsBackHovered] = useState(false);
    const [apiTotalCount, setApiTotalCount] = useState<number | null>(null);
    const [isPersonLoading, setIsPersonLoading] = useState(true);
    const [isDetailsLoading, setIsDetailsLoading] = useState(true);

    // Track if we've already fetched for this ID
    const fetchedRef = React.useRef<string | null>(null);
    const [localMovies, setLocalMovies] = useState<any[]>([]);

    // Fetch movies for this person
    useEffect(() => {
        // Reset state on ID change
        setDisplayLimit(36);
        setApiTotalCount(null);
        setIsPersonLoading(true);
        // setIsDetailsLoading(true); // Don't reset details loading here, handled in separate effect
        setLocalMovies([]);

        if (id && fetchedRef.current !== id) {
            fetchedRef.current = id;
            // Initial fetch: 30 items (5 rows)
            fetchMoviesByPerson(id, 0, 30)
                .then(res => {
                    if (res.totalCount !== undefined) setApiTotalCount(res.totalCount);
                    // STORE LOCAL COPY to bypass context delays/issues
                    setLocalMovies(res.movies || []);
                    setIsPersonLoading(false);
                })
                .catch((err) => {
                    console.error('[PersonPage] Fetch failed:', err);
                    setIsPersonLoading(false);
                });
        } else if (!id) {
            setIsPersonLoading(false);
            fetchedRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // Only re-run when ID changes

    // Track if we've already loaded details for this ID
    const detailsLoadedRef = React.useRef<string | null>(null);

    // Fetch Rich Person Details (Supabase -> TMDB)
    useEffect(() => {
        if (!id) return;

        // Reset loading if ID changed (even if detailsLoadedRef matches, logic implies new mount)
        // But safer to track ref mismatch
        if (detailsLoadedRef.current !== id) {
            setIsDetailsLoading(true);
        } else {
            // Already loaded for this ID
            return;
        }

        detailsLoadedRef.current = id;

        const loadPersonDetails = async () => {
            try {
                let tmdbId = getTmdbId(id);
                let searchName = '';

                // Handle Director (Search by Name if no ID)
                if (!tmdbId && id.startsWith('director-')) {
                    searchName = decodeURIComponent(id.replace('director-', ''));
                    if (directorMap && directorMap[searchName]) {
                        tmdbId = directorMap[searchName];
                    }
                }

                // let bioFoundInDb = false;

                // 1. Try Loading from Supabase 'cast' table (OPTIMIZED BIO)
                if (tmdbId) {
                    try {
                        const { data: dbCast, error } = await supabase
                            .from('cast')
                            .select('*')
                            .eq('tmdb_id', `tmdb-person-${tmdbId}`)
                            .single();

                        if (!error && dbCast && (dbCast.biography || dbCast.biography === '')) {
                            setActorsCache(prev => ({
                                ...prev,
                                [tmdbId!]: {
                                    id: tmdbId!,
                                    name: dbCast.name,
                                    biography: dbCast.biography,
                                    profile_path: dbCast.image_url,
                                }
                            }));
                        }
                    } catch (err) {
                        console.warn('[PersonPage] Cast table query failed (non-critical)');
                    }
                }

                // 2. Resolve ID via TMDB Search if still unknown (Director)
                if (!tmdbId && searchName) {
                    const results = await searchPerson(searchName);
                    if (results && results.length > 0) {
                        tmdbId = results[0].id.toString();
                        setDirectorMap(prev => ({ ...prev, [searchName]: tmdbId! }));
                    }
                }

                // 3. Fetch Full Details from TMDB (fallback/enrich) ALWAYS to get metadata (Birthday, etc.)
                // We use existing bio if available (handled in merge below)
                if (tmdbId) {
                    const data = await fetchPersonDetails(tmdbId);
                    if (data) {
                        // CACHE TO SUPABASE: Save the fresh TMDB data for next time
                        // NOTE: Even if bio is empty, we save it so we know we checked.
                        await cachePersonDetails(tmdbId, data);

                        setActorsCache(prev => {
                            const existing = prev?.[tmdbId!] || {};
                            const finalBio = (existing as any).biography || data.biography;

                            return {
                                ...prev,
                                [tmdbId!]: {
                                    ...data,
                                    ...existing,
                                    biography: finalBio
                                }
                            };
                        });
                    }
                }
            } catch (e) {
                console.error('Error loading person details:', e);
            } finally {
                setIsDetailsLoading(false);
            }
        };

        loadPersonDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // Only re-run when ID changes

    // ... (keep scroll, fetchData effects)

    // Helper to extract numeric ID
    const getTmdbId = (fullId: string) => {
        const match = fullId.match(/-(\d+)$/) || fullId.match(/^(\d+)$/);
        return match ? match[1] : null;
    };

    const isDirectorPage = id?.startsWith('director-');
    const directorName = isDirectorPage ? decodeURIComponent(id!.replace('director-', '')) : null;

    // 2. Find Rich Details (Moved up for dependency)
    const details = useMemo(() => {
        if (!id || !actorsCache) return null;

        let tmdbId: string | null = null;

        if (isDirectorPage && directorName && directorMap) {
            tmdbId = directorMap[directorName] || null;
        } else {
            tmdbId = getTmdbId(id);
        }

        if (tmdbId && actorsCache[tmdbId]) {
            return actorsCache[tmdbId];
        }
        return null;
    }, [id, actorsCache, isDirectorPage, directorName, directorMap]);

    // 1. Find Person Basic Info
    const person = useMemo(() => {
        // 1. Details from Cache (Most Reliable)
        if (details) {
            return {
                id: details.id || id,
                name: details.name,
                imageUrl: details.profile_path
            };
        }

        if (!id) return null;

        if (isDirectorPage && directorName) {
            if (['unknown', 'n/a'].includes(directorName.toLowerCase())) return null;
            return {
                id: id,
                name: directorName,
                imageUrl: undefined
            };
        }

        // 2. Search in Global Movies
        for (const movie of movies) {
            const member = movie.cast?.find(c => c.id === id);
            if (member) return member;
        }

        // 3. Search in Local Movies (Fallback)
        for (const movie of localMovies) {
            const member = movie.cast?.find((c: any) => c.id === id);
            if (member) return member;
        }

        return null;
    }, [movies, localMovies, id, isDirectorPage, directorName, details]);

    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [galleryLimit, setGalleryLimit] = useState(10);

    // ... (gallery functions)
    const openGallery = (index: number) => {
        setSelectedImageIndex(index);
        document.body.style.overflow = 'hidden';
    };

    const closeGallery = () => {
        setSelectedImageIndex(null);
        document.body.style.overflow = 'unset';
    };

    const nextImage = (e?: React.MouseEvent | KeyboardEvent) => {
        if (e && 'stopPropagation' in e) {
            e.stopPropagation();
            if ('preventDefault' in e) e.preventDefault();
        }
        if (selectedImageIndex !== null && details?.images) {
            setSelectedImageIndex((prev) => (prev! + 1) % details.images!.length);
        }
    };

    const prevImage = (e?: React.MouseEvent | KeyboardEvent) => {
        if (e && 'stopPropagation' in e) {
            e.stopPropagation();
            if ('preventDefault' in e) e.preventDefault();
        }
        if (selectedImageIndex !== null && details?.images) {
            setSelectedImageIndex((prev) => (prev! - 1 + details.images!.length) % details.images!.length);
        }
    };

    // ... (keyboard effects)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedImageIndex === null) return;

            if (e.key === 'Escape') closeGallery();
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextImage(e);
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevImage(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIndex, details]);

    const galleryScrollRef = React.useRef<HTMLDivElement>(null);
    const [showGalleryControls, setShowGalleryControls] = useState(false);
    const [isGalleryLoaded, setIsGalleryLoaded] = useState(false);

    const scrollGallery = (direction: 'left' | 'right') => {
        if (galleryScrollRef.current) {
            const { current } = galleryScrollRef;
            const scrollAmount = direction === 'left' ? -500 : 500;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // ... (scroll check effect)
    useEffect(() => {
        const checkScroll = () => {
            if (galleryScrollRef.current) {
                const { scrollWidth, clientWidth } = galleryScrollRef.current;
                setShowGalleryControls(scrollWidth > clientWidth);
            }
        };

        checkScroll();
        window.addEventListener('resize', checkScroll);
        // Also check when images or limit changes
        return () => window.removeEventListener('resize', checkScroll);
    }, [details?.images, galleryLimit]);


    // 3. Get All Relevant Movies
    const allRelevantMovies = useMemo(() => {
        if (!id) return [];

        // Combine Global Context + Local Fetch (Deduplicated)
        const combinedMap = new Map();

        // 1. Add Context Movies
        movies.forEach(m => combinedMap.set(m.id, m));

        // 2. Add Local Movies (Prefer these if fetched recently)
        localMovies.forEach(m => combinedMap.set(m.id, m));

        const allMovies = Array.from(combinedMap.values());

        const filtered = allMovies
            .filter(movie => {
                if (isDirectorPage && directorName) {
                    // Robust comparison: case-insensitive, partial match (for co-directors)
                    const dName = directorName.trim().toLowerCase();
                    const mDirector = movie.director?.toLowerCase() || '';
                    return mDirector.includes(dName);
                }
                // Robust Match: Check intersection of IDs or Numeric Match
                const personTmdbId = getTmdbId(id);
                return movie.cast?.some((c: CastMember) => {
                    // Exact match
                    if (c.id === id) return true;
                    // Numeric match (handles aliases)
                    const castTmdbId = getTmdbId(c.id);
                    return personTmdbId && castTmdbId && personTmdbId === castTmdbId;
                });
            })
            // IMPORTANT: Match server-side sort to avoid jumpiness
            .sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));

        return filtered;
    }, [movies, localMovies, id, isDirectorPage, directorName]);



    // 4. Extract All Genres
    const availableGenres = useMemo(() => {
        const genres = new Set<string>();
        allRelevantMovies.forEach(movie => {
            if (movie.tags && movie.tags.length > 0) {
                movie.tags.forEach((t: string) => genres.add(t));
            }
        });
        return ['All', ...Array.from(genres).sort()];
    }, [allRelevantMovies]);

    // 5. Filter Movies
    const filteredMovies = useMemo(() => {
        if (selectedGenres.length === 0) return allRelevantMovies;
        return allRelevantMovies.filter(movie => selectedGenres.every(g => movie.tags?.includes(g)));
    }, [allRelevantMovies, selectedGenres]);

    const toggleGenre = (genre: string) => {
        setDisplayLimit(30);
        if (genre === 'All') {
            setSelectedGenres([]);
            return;
        }
        setSelectedGenres(prev => {
            if (prev.includes(genre)) {
                return prev.filter(g => g !== genre);
            } else {
                return [...prev, genre];
            }
        });
    };

    // 6. Slice
    const displayedMovies = useMemo(() => {
        return filteredMovies.slice(0, displayLimit);
    }, [filteredMovies, displayLimit]);

    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const handleLoadMore = React.useCallback(async () => {
        // Base logic: Increase limit
        const nextLimit = displayLimit + 30;
        setDisplayLimit(nextLimit);

        // Fetch logic: If we have exhausted known movies but API has more
        if (id && apiTotalCount && allRelevantMovies.length < apiTotalCount) {
            setIsLoadingMore(true);
            try {
                const res = await fetchMoviesByPerson(id, allRelevantMovies.length, 30);
                if (res.movies && res.movies.length > 0) {
                    setLocalMovies(prev => {
                        // Deduplicate against existing local movies
                        const existingIds = new Set(prev.map(m => m.id));
                        const uniqueNew = res.movies.filter(m => !existingIds.has(m.id));

                        // If we fetched movies but they are all duplicates, we are done.
                        if (uniqueNew.length === 0) {
                            setApiTotalCount(allRelevantMovies.length);
                            return prev;
                        }

                        return [...prev, ...uniqueNew];
                    });
                } else {
                    // API returned nothing, so we reached the end regardless of count.
                    setApiTotalCount(allRelevantMovies.length);
                }
            } catch (e) {
                console.error('Failed to load more movies:', e);
            } finally {
                setIsLoadingMore(false);
            }
        }
    }, [displayLimit, id, apiTotalCount, allRelevantMovies.length, fetchMoviesByPerson]);

    // Infinite Scroll Observer
    const loaderRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting && !isLoadingMore) {
                const hasMoreLocal = displayedMovies.length < filteredMovies.length;
                const hasMoreServer = apiTotalCount ? allRelevantMovies.length < apiTotalCount : false;

                if (hasMoreLocal || hasMoreServer) {
                    handleLoadMore();
                }
            }
        }, { threshold: 0.1, rootMargin: '200px' });

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [isLoadingMore, displayedMovies.length, filteredMovies.length, allRelevantMovies.length, apiTotalCount, handleLoadMore]);

    if (isLoading || isPersonLoading || isDetailsLoading) {
        // INSTANT METADATA: Parse name from URL ID so Google sees it immediately (while Skeleton shows)
        let instantName = 'Person';
        if (id) {
            // Remove the trailing ID (e.g. "michael-c-hall-53820" -> "michael c hall")
            const cleanSlug = id.replace(/-?\d+$/, '').replace(/-/g, ' ');
            // Capitalize (e.g. "Michael C Hall")
            instantName = cleanSlug.replace(/\b\w/g, c => c.toUpperCase()).trim();
            if (!instantName) instantName = 'Person Details'; // Fallback if ID was just numbers
        }

        return (
            <>
                <Helmet>
                    <title>{instantName} - Filmospere</title>
                    <meta name="description" content={`Explore movies, biography, and filmography of ${instantName} on Filmospere. The ultimate destination for discovering ${instantName}'s work.`} />
                    <meta name="robots" content="index, follow" />
                </Helmet>
                <PersonSkeleton />
            </>
        );
    }

    if (!person) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white' }}>
                <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <ArrowLeft size={24} /> Back
                    </button>
                </div>
                <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
                    <h2>Actor not found</h2>
                    <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#e50914', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white' }}>
            <Helmet>
                <title>{person.name} Movies, Bio & Gallery | Filmospere</title>
                {(() => {
                    const topMovies = allRelevantMovies
                        .slice(0, 3)
                        .map(m => m.title)
                        .join(', ');

                    const desc = topMovies
                        ? `${person.name} - Known for ${topMovies}, and more. Read the full biography and explore the complete filmography on Filmospere.`
                        : `Learn more about ${person.name}, their biography, known for ${details?.known_for_department || 'acting'}, and full filmography on Filmospere.`;

                    return (
                        <>
                            <meta name="description" content={desc} />
                            <meta property="og:title" content={`${person.name} - Filmospere`} />
                            <meta property="og:description" content={desc} />
                            <meta property="og:image" content={details?.profile_path ? `https://image.tmdb.org/t/p/w500${details.profile_path}` : 'https://filmospere.com/og-image.jpg'} />
                            <meta property="og:type" content="profile" />
                        </>
                    );
                })()}

                {(!details?.biography || details.biography.length < 50) ? (
                    <meta name="robots" content="noindex, nofollow" />
                ) : (
                    <meta name="robots" content="index, follow" />
                )}
            </Helmet>

            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(to bottom, #1f1f1f 0%, #141414 100%)',
                position: 'relative',
                marginBottom: '2rem'
            }}>
                <div style={{ position: 'fixed', top: '70px', left: '2rem', zIndex: 90 }}>
                    <button
                        onClick={() => navigate(-1)}
                        onMouseEnter={() => setIsBackHovered(true)}
                        onMouseLeave={() => setIsBackHovered(false)}
                        style={{
                            background: isBackHovered ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            transition: 'all 0.3s ease',
                            opacity: isBackHovered ? 1 : (isScrolled ? 0.25 : 1)
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="container actor-hero">
                    {/* Left Column: Image */}
                    <div className="actor-image-container">
                        {details?.profile_path ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w500${details.profile_path}`}
                                alt={person.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : person.imageUrl ? (
                            <img
                                src={getOptimizedImageUrl(person.imageUrl, 400)}
                                alt={person.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                <User size={64} />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Info */}
                    <div className="actor-info">
                        <h1 className="actor-name" style={{ fontWeight: '800', marginBottom: '0.5rem', lineHeight: '1.1' }}>{person.name}</h1>
                        {(() => {
                            let creditCount = 0;
                            if (isDirectorPage) {
                                creditCount = details?.movie_credits?.crew?.filter((c: any) => c.job === 'Director')?.length || 0;
                            } else {
                                creditCount = details?.movie_credits?.cast?.length || 0;
                            }
                            // Fallback: If credit count is missing or suspiciously low, use the count of movies we actually found/know about
                            const totalCredits = Math.max(creditCount, apiTotalCount || 0, allRelevantMovies.length);

                            return (
                                <div className="actor-known-for" style={{ color: 'var(--primary-color)', marginBottom: '1.5rem', fontWeight: '500' }}>
                                    Known for {totalCredits} {totalCredits === 1 ? 'Movie' : 'Movies'}
                                </div>
                            );
                        })()}

                        {details && (
                            <div style={{ animation: 'fadeIn 0.5s ease' }}>
                                <div className="actor-stats-grid">
                                    {details.birthday && (
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Born</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{formatDate(details.birthday)}</div>
                                        </div>
                                    )}
                                    {details.place_of_birth && (
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Place of Birth</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{details.place_of_birth}</div>
                                        </div>
                                    )}
                                    {details.known_for_department && (
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Department</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{details.known_for_department}</div>
                                        </div>
                                    )}
                                </div>

                                {details.biography ? (
                                    <p style={{
                                        color: '#ccc',
                                        lineHeight: '1.7',
                                        fontSize: '1rem',
                                        marginBottom: '2rem',
                                        maxWidth: '800px',
                                        whiteSpace: 'pre-line'
                                    }}>
                                        {details.biography}
                                    </p>
                                ) : (
                                    <p style={{ color: '#666', fontStyle: 'italic' }}>Biography not available.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>


            </div>

            {/* Filmography Section */}
            <div className="container" style={{ paddingBottom: '4rem' }}>
                <h2 className="actor-filmography-title" style={{
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    borderLeft: '4px solid var(--primary-color)',
                    paddingLeft: '1rem'
                }}>
                    Filmography
                </h2>

                {/* Genre Filters */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem',
                    marginBottom: '2rem',
                    scrollbarWidth: 'none'
                }}>
                    {availableGenres.map(genre => {
                        const isSelected = genre === 'All'
                            ? selectedGenres.length === 0
                            : selectedGenres.includes(genre);

                        return (
                            <button
                                key={genre}
                                onClick={() => toggleGenre(genre)}
                                className="section-genre-button"
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '24px',
                                    border: isSelected ? '1px solid var(--primary-color)' : '1px solid #444',
                                    backgroundColor: isSelected ? 'var(--primary-color)' : 'transparent',
                                    color: isSelected ? 'white' : '#aaa',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = '#888';
                                        e.currentTarget.style.color = 'white';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = '#444';
                                        e.currentTarget.style.color = '#aaa';
                                    }
                                }}
                            >
                                {genre}
                            </button>
                        );
                    })}
                </div>

                {isPersonLoading ? (
                    <div className="cols-6-grid">
                        {[...Array(12)].map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                ) : displayedMovies.length === 0 ? (
                    <div style={{ color: '#666', fontStyle: 'italic', padding: '2rem', textAlign: 'center' }}>
                        No movies found in this category.
                    </div>
                ) : (
                    <div className="cols-6-grid">
                        {displayedMovies.map(movie => (
                            <MovieCard
                                key={movie.id}
                                movie={movie}
                                onClick={(m) => navigate(`/movie/${m.slug || m.id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Infinite Scroll Sentinel */}
                {((displayedMovies.length < filteredMovies.length) || (apiTotalCount && allRelevantMovies.length < apiTotalCount)) && (
                    <div ref={loaderRef} style={{ marginTop: '2rem' }}>
                        {isLoadingMore && (
                            <div className="cols-6-grid">
                                {[...Array(6)].map((_, i) => (
                                    <MovieCardSkeleton key={`skeleton-loadmore-${i}`} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Gallery Section */}
            {details?.images && details.images.length > 0 && (
                <div className="container" style={{ marginTop: '4rem', marginBottom: '2rem' }}>
                    <div
                        onClick={() => setIsGalleryLoaded(!isGalleryLoaded)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isGalleryLoaded ? '1.5rem' : '0',
                            userSelect: 'none'
                        }}
                    >
                        <h2 className="actor-filmography-title" style={{
                            fontWeight: 'bold',
                            borderLeft: '4px solid #e50914',
                            paddingLeft: '1rem',
                            fontSize: '1.5rem',
                            margin: 0,
                            marginRight: '1rem'
                        }}>
                            Gallery
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#888',
                            fontSize: '1rem',
                            transition: 'color 0.2s'
                        }}
                            onMouseEnter={e => e.currentTarget.style.color = 'white'}
                            onMouseLeave={e => e.currentTarget.style.color = '#888'}
                        >
                            <span>{details.images.length} Images</span>
                            {isGalleryLoaded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </div>

                    {isGalleryLoaded && (
                        <div className="gallery-wrapper" style={{ position: 'relative' }}>
                            {/* Left Scroll Button */}
                            {showGalleryControls && (
                                <button
                                    className="gallery-nav-button left-button"
                                    onClick={() => scrollGallery('left')}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 10,
                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        padding: '10px',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(5px)'
                                    }}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                            )}

                            <div
                                ref={galleryScrollRef}
                                className="gallery-scroll-container"
                                style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    overflowX: 'auto',
                                    paddingBottom: '1rem',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                    WebkitOverflowScrolling: 'touch',
                                    scrollBehavior: 'smooth'
                                }}
                            >
                                {details.images.slice(0, galleryLimit).map((img, index) => (
                                    <div key={index}
                                        onClick={() => openGallery(index)}
                                        style={{
                                            flex: '0 0 auto',
                                            width: '220px',
                                            height: '330px',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                            backgroundColor: '#222',
                                            cursor: 'pointer'
                                        }}>
                                        <img
                                            src={`https://image.tmdb.org/t/p/w500${img}`}
                                            alt={`${person.name} ${index + 1}`}
                                            loading="lazy"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                        />
                                    </div>
                                ))}

                                {/* Load More Card */}
                                {details.images.length > galleryLimit && (
                                    <div
                                        onClick={() => setGalleryLimit(prev => prev + 10)}
                                        style={{
                                            flex: '0 0 auto',
                                            width: '220px',
                                            height: '330px',
                                            borderRadius: '12px',
                                            border: '2px solid #333',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            backgroundColor: '#1a1a1a',
                                            transition: 'all 0.2s ease',
                                            color: 'white'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.backgroundColor = '#222';
                                            e.currentTarget.style.borderColor = 'white';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.backgroundColor = '#1a1a1a';
                                            e.currentTarget.style.borderColor = '#333';
                                        }}
                                    >
                                        <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</span>
                                        <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Load More</span>
                                        <span style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>
                                            ({details.images.length - galleryLimit} more)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Right Scroll Button */}
                            {showGalleryControls && (
                                <button
                                    className="gallery-nav-button right-button"
                                    onClick={() => scrollGallery('right')}
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 10,
                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        padding: '10px',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(5px)'
                                    }}
                                >
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </div>
                    )}

                </div>
            )}
            {/* Gallery Lightbox */}
            {selectedImageIndex !== null && details?.images && (
                <div
                    className="lightbox-container"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.95)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={closeGallery}
                >

                    {/* Close Button */}
                    <button
                        onClick={closeGallery}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            zIndex: 1001,
                            padding: '10px'
                        }}
                    >
                        &times;
                    </button>

                    {/* Left Arrow */}
                    <button
                        className="lightbox-nav-button"
                        onClick={prevImage}
                        style={{
                            position: 'absolute',
                            left: '20px',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '1rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1001
                        }}
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Main Image */}
                    <div style={{
                        maxWidth: '90%',
                        maxHeight: '90%',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <img
                            src={`https://image.tmdb.org/t/p/original${details.images[selectedImageIndex]}`}
                            alt={`${person.name} full`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: '4px',
                                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                            }}
                        />
                        <div style={{
                            textAlign: 'center',
                            marginTop: '1rem',
                            color: '#888',
                            fontSize: '0.9rem'
                        }}>
                            {selectedImageIndex + 1} / {details.images.length}
                        </div>
                    </div>

                    {/* Right Arrow */}
                    <button
                        className="lightbox-nav-button"
                        onClick={nextImage}
                        style={{
                            position: 'absolute',
                            right: '20px',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '1rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1001,
                            transform: 'rotate(180deg)'
                        }}
                    >
                        <ArrowLeft size={24} />
                    </button>

                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Lightbox Navigation Buttons */
                .lightbox-nav-button {
                    opacity: 1; /* Default visible */
                }

                .lightbox-nav-button:hover {
                    background-color: rgba(255,255,255,0.2) !important; /* Hover effect for background */
                }


                @media (min-width: 768px) {
                    .lightbox-nav-button {
                        opacity: 0 !important; /* Hidden on desktop by default */
                        transition: opacity 0.3s ease, background-color 0.2s ease; /* Smooth transition */
                    }

                    .lightbox-container:hover .lightbox-nav-button {
                        opacity: 1 !important; /* Visible on container hover */
                    }
                    
                    /* Gallery Scroll Buttons Desktop Logic */
                    .gallery-nav-button {
                        display: flex !important;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    
                    .gallery-wrapper:hover .gallery-nav-button {
                        opacity: 1;
                    }
                }
                
                /* Gallery Scroll Buttons Mobile - Always visible, semi-transparent */
                .gallery-nav-button {
                    display: flex !important;
                    opacity: 0.6;
                    width: 44px;
                    height: 44px;
                    transition: opacity 0.2s ease;
                }
                
                .gallery-nav-button:active {
                    opacity: 1;
                }
            `}</style>
            <Footer />
        </div>
    );
};

export default PersonPage;
