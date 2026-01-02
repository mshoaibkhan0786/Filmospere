import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import Footer from '../components/Footer';
import { useMovies } from '../context/MovieContext';
import type { Movie } from '../types';

import { isValidContent } from '../utils/formatUtils';

const SECTION_DESCRIPTIONS: Record<string, string> = {
    'Action': 'Adrenaline-pumping films featuring intense combat, chases, and heroic feats.',
    'Adventure': 'Epic journeys, exploration, and daring quests into the unknown.',
    'Comedy': 'Light-hearted stories designed to make you laugh and lift your spirits.',
    'Drama': 'Character-driven narratives exploring realistic themes and emotional depth.',
    'Horror': 'Spine-chilling tales designed to frighten, shock, and thrill.',
    'Sci-Fi': 'Futuristic concepts, advanced technology, and space exploration.',
    'Thriller': 'Suspenseful plots that keep you on the edge of your seat.',
    'Romance': 'Stories of love, relationships, and emotional connection.',
    'Animation': 'Creative and visually stunning stories for all ages.',
    'Fantasy': 'Magical worlds, mythical creatures, and supernatural elements.',
    'Mystery': 'Puzzling crimes, secrets, and whodunits waiting to be solved.',
    'Crime': 'Gritty narratives focusing on criminal acts and justice.',
    'Documentary': 'Real-life stories, factual records, and educational content.',
    'Family': 'Movies suitable for the entire family to enjoy together.',
    'Music': 'Films where music plays a central role in the storytelling.',
    'History': 'Dramatic depictions of historical events and figures.',
    'War': 'Intense and emotional stories set during times of conflict.',
    'Biography': 'Life stories of real people and their journeys.',
    'Sport': 'Inspirational stories centered around sports and athletes.',
    'Tollywood': 'The vibrant and action-packed cinema of the Telugu film industry.',
    'Bollywood': 'The colorful, musical, and dramatic world of Hindi cinema.',
    'Hollywood': 'Global blockbusters and critically acclaimed films from the US.',
    'Kollywood': 'The dynamic and diverse cinema of the Tamil film industry.',
    'Sandalwood': 'The rich and storytelling-focused cinema of the Kannada industry.',
    'Mollywood': 'The artistic and realistic cinema of the Malayalam industry.',
    'Pollywood': 'The lively and energetic cinema of the Punjabi film industry.',
    'Bengali Cinema': 'The intellectually stimulating and artistic cinema of Bengal.',
    'Marathi Cinema': 'The content-driven and culturally rich cinema of Maharashtra.',
    'K-Drama': 'Popular Korean television series known for emotional depth and style.',
    'Anime': 'Japanese animation known for colorful graphics and vibrant characters.',
    'Chinese Cinema': 'A diverse range of films from the Chinese-speaking world.',
    'English': 'A wide selection of English-language movies from around the world.',
    'Hindi': 'Popular movies in the Hindi language.',
    'Tamil': 'Popular movies in the Tamil language.',
    'Telugu': 'Popular movies in the Telugu language.',
    'Kannada': 'Popular movies in the Kannada language.',
    'Malayalam': 'Popular movies in the Malayalam language.',
    'Punjabi': 'Popular movies in the Punjabi language.',
    'Bengali': 'Popular movies in the Bengali language.',
    'Marathi': 'Popular movies in the Marathi language.',
    'Web Series': 'Binge-worthy episodic content across various genres.',
    'Latest Movies & Series': 'The newest releases fresh on the platform.',
    'Trending': 'What everyone is watching right now.'
};

const SectionPage: React.FC = () => {
    const { movies, fetchMoviesByTag, searchMovies } = useMovies(); // Added searchMovies
    const { title } = useParams<{ title: string }>();
    const navigate = useNavigate();

    // Normalize Title for Case-Insensitive Matching
    // Fixes issue where /section/crime (lowercase) fails vs /section/Crime (Title Case)
    // DO NOT REMOVE THIS NORMALIZATION BLOCK
    const rawTitle = decodeURIComponent(title || '');
    const normalizedTitle = useMemo(() => {
        if (!rawTitle) return '';
        // Find matching key in SECTION_DESCRIPTIONS (case-insensitive)
        const match = Object.keys(SECTION_DESCRIPTIONS).find(k => k.toLowerCase() === rawTitle.toLowerCase());
        // Return canonical key if found, otherwise raw title (e.g. for search strings or unknown tags)
        return match || rawTitle;
    }, [rawTitle]);

    const decodedTitle = normalizedTitle; // Use normalized title everywhere downstream

    // States
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

    // Data States
    const [sectionMovies, setSectionMovies] = useState<Movie[]>([]); // Local state for THIS section/search
    const [totalCount, setTotalCount] = useState<number | null>(null);

    // Infinite Scroll State
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = useRef<HTMLDivElement>(null);
    const lastFetchedQuery = useRef<string | null>(null);

    // search mode vs section mode
    const isSearchMode = !!debouncedSearch;
    const isDebouncing = searchQuery !== debouncedSearch;
    const isStale = isSearchMode && debouncedSearch !== lastFetchedQuery.current;

    // Reset state when title changes
    useEffect(() => {
        setHasMore(true);
        setSearchQuery('');
        setDebouncedSearch('');
        lastFetchedQuery.current = null;
        setSelectedGenres([]);
        setSectionMovies([]);
        setTotalCount(null);
        setIsInitialLoading(true);

        // Initial Fetch for Section
        const loadInitial = async () => {
            if (!decodedTitle) return;
            try {
                // Fetch first batch (50 items = ~8 rows * 6 cols)
                const newMovies = await fetchMoviesByTag(decodedTitle, 0, 50);
                setSectionMovies(newMovies); // Initialize
                if (newMovies.length < 50) {
                    setHasMore(false);
                }
            } catch (e) {
                console.error("Failed initial load", e);
            } finally {
                setIsInitialLoading(false);
            }
        };
        loadInitial();
    }, [decodedTitle, fetchMoviesByTag]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500); // Increased debounce to 500ms for server efficiency
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle Search Queries (Server Side)
    useEffect(() => {
        if (!debouncedSearch) {
            lastFetchedQuery.current = null;
            // Revert to section movies if search cleared
            if (sectionMovies.length === 0 && !isInitialLoading) {
                // Reload section logic if needed, or purely rely on the title-effect to have loaded it.
                // Actually, if we switch back from search, we might want to reload the section data?
                // Or we could persist section data separately. For simplicity, let's just trigger title reload if needed or we can keep it simple.
                // Best UX: When search clears, just show the Section Movies again. 
                // We need to store 'originalSectionMovies' vs 'searchResults'? 
                // For now, let's assume if search clears, we re-fetch section or rely on cached context.
                // Ideally, we re-trigger the initial load logic.
                // But wait, the Title effect runs only on decodedTitle change.
                // If search clears, we should probably re-fetch the Section content if it was replaced.
                if (!isInitialLoading) { // Only if not already loading
                    fetchMoviesByTag(decodedTitle, 0, 30).then(res => {
                        setSectionMovies(res);
                        setHasMore(res.length >= 30);
                    });
                }
            }
            return;
        }

        const performSearch = async () => {
            setIsInitialLoading(true);
            setSectionMovies([]); // Clear current list
            try {
                const { results, count } = await searchMovies(debouncedSearch, 0, 30);
                setSectionMovies(results);
                setTotalCount(count);
                setHasMore(results.length < count);
                lastFetchedQuery.current = debouncedSearch;
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setIsInitialLoading(false);
            }
        };

        performSearch();
    }, [debouncedSearch, searchMovies, decodedTitle, fetchMoviesByTag]); // Re-run when search term changes

    // Infinite Scroll Logic
    const handleLoadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);

        const currentLength = sectionMovies.length;
        const BATCH_SIZE = 50;

        try {
            let newBatch: Movie[] = [];

            if (isSearchMode) {
                // Load more search results
                const { results } = await searchMovies(debouncedSearch, currentLength, BATCH_SIZE);
                newBatch = results;
                if (totalCount !== null && (currentLength + results.length >= totalCount)) {
                    setHasMore(false);
                }
            } else {
                // Load more section movies
                newBatch = await fetchMoviesByTag(decodedTitle, currentLength, BATCH_SIZE);
                if (newBatch.length < BATCH_SIZE) {
                    setHasMore(false);
                }
            }

            if (newBatch.length > 0) {
                setSectionMovies(prev => {
                    // Deduplicate just in case
                    const existingIds = new Set(prev.map(m => m.id));
                    const uniqueNew = newBatch.filter(m => !existingIds.has(m.id));
                    return [...prev, ...uniqueNew];
                });
            } else {
                setHasMore(false);
            }

        } catch (e) {
            console.error("Load more failed", e);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, sectionMovies.length, isSearchMode, debouncedSearch, totalCount, decodedTitle, fetchMoviesByTag, searchMovies]);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isInitialLoading) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1, rootMargin: '800px' } // Increased Lookahead (Seamless Scroll)
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [handleLoadMore, hasMore, isLoadingMore, isInitialLoading]);


    // 3. Process Data (Available Genres & Genre Filtering)
    // We compute available genres from the loaded movies + global movies to give a good list
    const availableGenres = useMemo(() => {
        // Collect genres from context movies to ensure we have a good list even if local list is small
        const genreSet = new Set<string>();
        // Bias towards movies in the current section
        sectionMovies.forEach(m => m.tags?.forEach(t => t !== decodedTitle && genreSet.add(t)));
        // Also add from global context to fill gaps
        movies.forEach(m => m.tags?.forEach(t => t !== decodedTitle && genreSet.add(t)));

        return ['All', ...Array.from(genreSet).sort()];
    }, [sectionMovies, movies, decodedTitle]);

    // 3. Process Data
    const processedData = useMemo(() => {
        let data = sectionMovies;

        // Local Genre Filter
        if (selectedGenres.length > 0) {
            data = data.filter(m => selectedGenres.every(g => m.tags?.includes(g)));
        }

        // Remove duplicates again just to be safe
        data = Array.from(new Map(data.map(m => [m.id, m])).values());

        // REMOVED SORTING HERE to prevent layout shifts during infinite scroll.
        // We trust the source (API/Backup) to provide them in roughly the correct order (batch by batch).
        // If we strictly sort here, a new 2025 movie loaded in batch #2 would jump to the top, causing flicker.

        return data.filter(m => isValidContent(m));
    }, [sectionMovies, selectedGenres, decodedTitle, isSearchMode]);

    const matchedKey = Object.keys(SECTION_DESCRIPTIONS).find(k => k.toLowerCase() === decodedTitle.toLowerCase());
    const description = SECTION_DESCRIPTIONS[decodedTitle] || (matchedKey ? SECTION_DESCRIPTIONS[matchedKey] : '') || (isSearchMode ? `Search results for "${debouncedSearch}"` : '');

    const toggleGenre = (genre: string) => {
        if (genre === 'All') {
            setSelectedGenres([]);
            return;
        }
        setSelectedGenres(prev => {
            if (prev.includes(genre)) return prev.filter(g => g !== genre);
            return [...prev, genre];
        });
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', paddingBottom: '2rem' }}>
            <Helmet>
                <title>{isSearchMode ? `Search: ${debouncedSearch}` : decodedTitle} - Filmospere</title>
            </Helmet>
            <Navbar onSearch={setSearchQuery} />

            <main className="container" style={{ marginTop: '2rem', paddingTop: '80px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="section-title" style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                            {isSearchMode ? `Results for "${debouncedSearch}"` : decodedTitle}
                        </h1>
                        {description && !isSearchMode && (
                            <p style={{ color: '#aaa', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.5' }}>
                                {description}
                            </p>
                        )}
                    </div>


                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '10px',
                            borderRadius: '50%',
                            fontSize: '1rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            backdropFilter: 'blur(10px)',
                            width: '40px',
                            height: '40px',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                </div>

                {/* Genre Pills Filter */}
                {availableGenres.length > 1 && (
                    <div style={{
                        display: 'flex',
                        gap: '0.8rem',
                        overflowX: 'auto',
                        paddingBottom: '0.5rem',
                        marginBottom: '2rem',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
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
                                        borderRadius: '50px',
                                        border: isSelected ? '1px solid #e50914' : '1px solid #333',
                                        backgroundColor: isSelected ? '#e50914' : 'rgba(255,255,255,0.05)',
                                        color: isSelected ? 'white' : '#ccc',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease',
                                        fontWeight: isSelected ? '600' : 'normal',
                                        flexShrink: 0
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.borderColor = 'white';
                                            e.currentTarget.style.color = 'white';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.borderColor = '#333';
                                            e.currentTarget.style.color = '#ccc';
                                        }
                                    }}
                                >
                                    {genre}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Initial Loading State */}
                {isInitialLoading || isDebouncing || isStale ? (
                    <div className="cols-6-grid">
                        {[...Array(48)].map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                ) : processedData.length > 0 ? (
                    <>
                        <div className="cols-6-grid">
                            {processedData.map(movie => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    onClick={(movie) => navigate(`/movie/${movie.slug || movie.id}`)}
                                />
                            ))}

                            {/* Infinite Scroll Skeletons */}
                            {isLoadingMore && [...Array(12)].map((_, i) => (
                                <MovieCardSkeleton key={`skeleton-${i}`} />
                            ))}
                        </div>

                        {/* Sentinel */}
                        <div ref={observerTarget} style={{ height: '10px', marginTop: '1rem' }} />
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        <p>No titles found matching your criteria.</p>
                    </div>
                )}
            </main>
            <Footer />
        </div >
    );
};

export default SectionPage;
