'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, X } from 'lucide-react';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './MovieCardSkeleton';
import type { Movie } from '../types';

interface SearchPageClientProps {
    initialQuery: string;
    initialResults: Movie[];
    initialCount: number;
}

const SearchPageClient: React.FC<SearchPageClientProps> = ({
    initialQuery,
    initialResults,
    initialCount,
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Query states
    const [query, setQuery] = useState(initialQuery);
    const [inputValue, setInputValue] = useState(initialQuery);

    // Results & pagination state
    const [movies, setMovies] = useState<Movie[]>(initialResults.slice(0, 10));
    const [hasMore, setHasMore] = useState(initialCount >= 10);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const lastFetchedQueryRef = useRef(initialQuery);

    // Sync when URL query changes (e.g., from Navbar or browser back/forward)
    useEffect(() => {
        const urlQuery = (searchParams.get('q') || searchParams.get('search') || '').trim();

        if (urlQuery !== query) {
            setQuery(urlQuery);
            setInputValue(urlQuery);
        }

        // Avoid re-fetching if we already fetched this exact query on initial render
        if (urlQuery === lastFetchedQueryRef.current) return;
        lastFetchedQueryRef.current = urlQuery;

        if (urlQuery.length < 2) {
            setMovies([]);
            setHasMore(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        fetch(`/api/movies?query=${encodeURIComponent(urlQuery)}&start=0&count=10`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setMovies(data);
                    setHasMore(data.length >= 10);
                } else {
                    setMovies([]);
                    setHasMore(false);
                }
            })
            .catch(err => {
                console.error('Search failed:', err);
                setMovies([]);
                setHasMore(false);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [searchParams, query]);

    // Handle in-page search submission
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed && trimmed !== query) {
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        }
    };

    // Handle "Load More" button click (fetches next 10 items)
    const handleLoadMore = async () => {
        if (isLoadingMore || !hasMore || !query) return;
        setIsLoadingMore(true);

        const currentLength = movies.length;
        try {
            const res = await fetch(`/api/movies?query=${encodeURIComponent(query)}&start=${currentLength}&count=10`);
            const newBatch: Movie[] = await res.json();

            if (!Array.isArray(newBatch) || newBatch.length === 0) {
                setHasMore(false);
                return;
            }

            if (newBatch.length < 10) {
                setHasMore(false);
            }

            setMovies(prev => {
                const seenIds = new Set(prev.map(m => m.id));
                const uniqueNew = newBatch.filter(m => !seenIds.has(m.id));
                if (uniqueNew.length === 0) {
                    setHasMore(false);
                }
                return [...prev, ...uniqueNew];
            });
        } catch (e: any) {
            if (e?.name === 'AbortError') return;
            console.error('Failed to load more results:', e);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', paddingBottom: '4rem' }}>
            <main className="container" style={{ paddingTop: '100px' }}>
                {/* Header row with back button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => router.push('/')}
                            aria-label="Back to home"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                width: '40px',
                                height: '40px',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                backdropFilter: 'blur(10px)',
                                transition: 'background 0.2s'
                            }}
                        >
                            <ArrowLeft size={22} />
                        </button>
                        <h1 className="section-title" style={{ fontWeight: 'bold', margin: 0, fontSize: '1.8rem' }}>
                            {query ? `Search: "${query}"` : 'Search Movies & Series'}
                        </h1>
                    </div>
                </div>

                {/* Dedicated On-Page Search Input */}
                <form
                    onSubmit={handleSearchSubmit}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#1f1f1f',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        marginBottom: '2rem',
                        border: '1px solid #333',
                        maxWidth: '680px',
                        width: '100%'
                    }}
                >
                    <Search size={20} color="#888" style={{ marginRight: '12px', flexShrink: 0 }} />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Search by title, actor, or genre..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '1rem',
                            outline: 'none',
                            width: '100%'
                        }}
                    />
                    {inputValue && (
                        <button
                            type="button"
                            onClick={() => {
                                setInputValue('');
                                router.push('/search?q=');
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px'
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                    <button
                        type="submit"
                        style={{
                            backgroundColor: '#e50914',
                            border: 'none',
                            color: 'white',
                            padding: '8px 18px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            marginLeft: '8px',
                            cursor: 'pointer',
                            flexShrink: 0
                        }}
                    >
                        Search
                    </button>
                </form>

                {/* Loading State for new query */}
                {isLoading ? (
                    <div className="cols-6-grid">
                        {[...Array(10)].map((_, i) => (
                            <MovieCardSkeleton key={`loading-${i}`} />
                        ))}
                    </div>
                ) : movies.length > 0 ? (
                    <>
                        {/* 10-Item Grid */}
                        <div className="cols-6-grid">
                            {movies.map(movie => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    onClick={(m) => router.push(`/movie/${(m.slug || m.id).replace(/\s+/g, '-')}`)}
                                />
                            ))}

                            {/* Loading more skeletons */}
                            {isLoadingMore && [...Array(6)].map((_, i) => (
                                <MovieCardSkeleton key={`skeleton-${i}`} />
                            ))}
                        </div>

                        {/* Explicit "Load More" Button */}
                        {hasMore && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', marginBottom: '2rem' }}>
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    style={{
                                        backgroundColor: '#e50914',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 32px',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                                        opacity: isLoadingMore ? 0.7 : 1,
                                        boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {isLoadingMore ? 'Loading More...' : 'Load More Results'}
                                </button>
                            </div>
                        )}
                    </>
                ) : query ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#b3b3b3' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
                            No results found for &quot;{query}&quot;
                        </h2>
                        <p style={{ fontSize: '0.95rem', color: '#888' }}>
                            Please check your spelling or try searching for another movie, actor, or genre.
                        </p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#888' }}>
                        <p>Type a movie title, actor, or category in the search bar above.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SearchPageClient;
