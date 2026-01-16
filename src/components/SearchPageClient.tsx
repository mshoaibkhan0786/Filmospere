'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Correct hook for query params
import { ArrowLeft } from 'lucide-react';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './MovieCardSkeleton';
import Footer from './Footer';
import type { Movie } from '../types';

interface SearchPageClientProps {
    initialQuery: string;
    initialResults: Movie[];
    initialCount: number;
}

const SearchPageClient: React.FC<SearchPageClientProps> = ({ initialQuery, initialResults, initialCount }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentQueryFromUrl = searchParams.get('q') || '';

    // State
    const [movies, setMovies] = useState<Movie[]>(initialResults);
    const [hasMore, setHasMore] = useState(initialResults.length < initialCount);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    const lastQueryRef = useRef(initialQuery);

    // If URL query changes client-side (e.g. user types in navbar which pushes new URL), 
    // we need to reset or handle that. 
    // However, since this is a Page, usually Next.js triggers a full navigation / re-render of Server Component if it's dynamic?
    // In App Router, navigating to ?q=foo from ?q=bar usually re-runs the Server Component if using `searchParams` prop,
    // OR it updates the `searchParams` prop.
    // Let's assume the Server Component handles the *initial* load of any new query, passing new props.
    // So we just sync state to props.

    useEffect(() => {
        if (currentQueryFromUrl !== lastQueryRef.current) {
            // If props didn't update yet but URL did? Or mostly props WILL update.
            // Actually, best to rely entirely on props passed from Server Component keying.
        }
    }, [currentQueryFromUrl]);

    // Reset when props change (re-search)
    // We can use a key'd component approach in page.tsx or useEffect here.
    useEffect(() => {
        setMovies(initialResults);
        setHasMore(initialResults.length < initialCount);
        lastQueryRef.current = initialQuery;
    }, [initialQuery, initialResults, initialCount]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);

        const currentLength = movies.length;
        const BATCH_SIZE = 20;

        try {
            const res = await fetch(`/api/movies?query=${encodeURIComponent(initialQuery)}&start=${currentLength}&count=${BATCH_SIZE}`);
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
            console.error("Load more search failed", e);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, movies.length, initialQuery]);

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

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', paddingBottom: '2rem' }}>
            <main className="container" style={{ paddingTop: '100px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="section-title" style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
                            Results for &quot;{initialQuery}&quot;
                        </h1>
                        <p style={{ color: '#aaa', fontSize: '1rem' }}>
                            {initialCount > 0 ? `Found ${initialCount} matches` : 'No matches found'}
                        </p>
                    </div>

                    <button
                        onClick={() => router.back()}
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
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                </div>

                {movies.length > 0 ? (
                    <>
                        <div className="cols-6-grid">
                            {movies.map(movie => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    onClick={(m) => router.push(`/movie/${m.slug || m.id}`)}
                                />
                            ))}

                            {isLoadingMore && [...Array(6)].map((_, i) => (
                                <MovieCardSkeleton key={`skeleton-${i}`} />
                            ))}
                        </div>
                        <div ref={observerTarget} style={{ height: '20px', marginTop: '1rem' }} />
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#b3b3b3' }}>
                        <p>No results found for &quot;{initialQuery}&quot;.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>Try checking your spelling or use more general terms.</p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default SearchPageClient;
