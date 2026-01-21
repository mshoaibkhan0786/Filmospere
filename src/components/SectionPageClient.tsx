'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './MovieCardSkeleton';
import type { Movie } from '../types';
import { isValidContent } from '../utils/formatUtils';

interface SectionPageClientProps {
    title: string;
    description?: string;
    initialMovies: Movie[];
    hasInitialMore: boolean;
}

const SectionPageClient: React.FC<SectionPageClientProps> = ({ title, description, initialMovies, hasInitialMore }) => {
    const router = useRouter();
    const [movies, setMovies] = useState<Movie[]>(initialMovies);
    const [hasMore, setHasMore] = useState(hasInitialMore);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const observerTarget = useRef<HTMLDivElement>(null);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);

        const currentLength = movies.length;
        const BATCH_SIZE = 50; // Match Vite's batch size for consistency

        try {
            // ...
            const res = await fetch(`/api/movies?tag=${encodeURIComponent(title)}&start=${currentLength}&count=${BATCH_SIZE}`);
            const newBatch: Movie[] = await res.json();

            if (newBatch.length < BATCH_SIZE) {
                setHasMore(false);
            }

            if (newBatch.length > 0) {
                setMovies(prev => {
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
    }, [isLoadingMore, hasMore, movies.length, title]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '800px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [loadMore, hasMore, isLoadingMore]);

    // 3. Process Data (Available Genres & Genre Filtering)
    // We compute available genres from the loaded movies + global movies to give a good list
    const availableGenres = useMemo(() => {
        const genreSet = new Set<string>();
        // Bias towards movies in the current section
        movies.forEach(m => m.tags?.forEach(t => t !== title && genreSet.add(t)));

        return ['All', ...Array.from(genreSet).sort()];
    }, [movies, title]);

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

    // 3. Process Data
    const processedData = useMemo(() => {
        let data = movies;

        // Local Genre Filter
        if (selectedGenres.length > 0) {
            data = data.filter(m => selectedGenres.every(g => m.tags?.includes(g)));
        }

        // Remove duplicates again just to be safe
        data = Array.from(new Map(data.map(m => [m.id, m])).values());

        // Filter valid content (must have poster and valid duration)
        return data.filter(m => isValidContent(m));
    }, [movies, selectedGenres, title]);

    return (
        <div>
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
            {/* Movies Grid */}
            {movies.length > 0 ? (
                <>
                    <div className="cols-6-grid">
                        {processedData.map(movie => (
                            <MovieCard
                                key={movie.id}
                                movie={movie}
                                onClick={(m) => router.push(`/movie/${m.slug || m.id}`)}
                            />
                        ))}

                        {isLoadingMore && selectedGenres.length === 0 && [...Array(12)].map((_, i) => (
                            <MovieCardSkeleton key={`skeleton-${i}`} />
                        ))}
                    </div>
                    <div ref={observerTarget} style={{ height: '20px', marginTop: '1rem' }} />
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#b3b3b3' }}>
                    <p>No titles found.</p>
                </div>
            )}
        </div>
    );
};

export default SectionPageClient;
