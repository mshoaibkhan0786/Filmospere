"use client";

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './MovieCardSkeleton';
import type { Movie } from '../types';
import { useRouter } from 'next/navigation';

interface HorizontalScrollSectionProps {
    title: string;
    data: Movie[];
    loading?: boolean;
    linkTo?: string;
    onEndReached?: () => void;
}

const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({ title, data, loading = false, linkTo, onEndReached }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [showLeftButton, setShowLeftButton] = useState(false);
    const [showRightButton, setShowRightButton] = useState(true);
    const [isScrollable, setIsScrollable] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [visibleCount] = useState(8);

    const checkScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

            const scrollable = scrollWidth > clientWidth;
            setIsScrollable(scrollable);

            if (!scrollable) {
                setShowLeftButton(false);
                setShowRightButton(false);
                return;
            }

            setShowLeftButton(scrollLeft > 0);
            const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10;
            setShowRightButton(!isAtEnd);

            if (isAtEnd && onEndReached) {
                onEndReached();
            }
        }
    };

    useEffect(() => {
        if (loading) return;
        checkScrollButtons();
        window.addEventListener('resize', checkScrollButtons);
        const container = scrollContainerRef.current;

        if (container) {
            container.addEventListener('scroll', checkScrollButtons);
        }
        return () => {
            window.removeEventListener('resize', checkScrollButtons);
            if (container) {
                container.removeEventListener('scroll', checkScrollButtons);
            }
        };
    }, [data, loading]);



    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { clientWidth } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.8;

            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (data.length === 0 && !loading) return null;

    return (
        <div className="section-container" style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2
                    onClick={() => !loading && linkTo && router.push(linkTo)}
                    style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        margin: 0,
                        borderLeft: '4px solid var(--primary-color)',
                        paddingLeft: '1rem',
                        cursor: linkTo ? 'pointer' : 'default',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => {
                        if (linkTo && !loading) {
                            e.currentTarget.style.color = '#e50914';
                        }
                    }}
                    onMouseLeave={e => {
                        if (linkTo && !loading) {
                            e.currentTarget.style.color = 'white';
                        }
                    }}
                >
                    {title}
                </h2>
            </div>

            <div
                className="scroll-wrapper"
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {isScrollable && !loading && isHovering && (
                    <button
                        onClick={() => scroll('left')}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 20,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            borderRadius: '50%',
                            padding: '10px',
                            cursor: 'pointer',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: showLeftButton ? 1 : 0.3,
                            transition: 'opacity 0.2s'
                        }}
                        className="scroll-btn"
                    >
                        <ChevronLeft size={24} />
                    </button>
                )}

                <div className="section-desktop-layout">
                    <div
                        ref={scrollContainerRef}
                        className="horizontal-scroll-layout"
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            overflowX: 'auto',
                            paddingBottom: '1rem',
                            scrollBehavior: 'smooth',
                            scrollbarWidth: 'none', // Hide scrollbar
                            msOverflowStyle: 'none'
                        }}
                    >
                        {loading ? (
                            [...Array(7)].map((_, i) => (
                                <div key={i} className="horizontal-scroll-card">
                                    <MovieCardSkeleton />
                                </div>
                            ))
                        ) : (
                            <>
                                {data.slice(0, 20).map((movie, i) => (
                                    <div key={movie.id} className="horizontal-scroll-card">
                                        <MovieCard
                                            movie={movie}
                                            onClick={(movie) => router.push(`/movie/${(movie.slug || movie.id).replace(/\s+/g, '-')}`)}
                                            priority={i < 5} // Eager load first 5 visible items
                                        />
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                <div className="section-mobile-layout">
                    {(() => {
                        const visibleData = data.slice(0, visibleCount);
                        const mid = Math.ceil(visibleData.length / 2); // Split evenly across 2 rows
                        const row1 = visibleData.slice(0, mid);
                        const row2 = visibleData.slice(mid);

                        return (
                            <div
                                className="mobile-scroll-container"
                                style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '10px' }}
                            >
                                <div className="mobile-scroll-row" style={{ display: 'flex', width: '100%', gap: '12px', overflowX: 'auto', padding: '0 4px' }}>
                                    {loading ? (
                                        [...Array(4)].map((_, i) => (
                                            <div key={i} className="horizontal-scroll-card">
                                                <MovieCardSkeleton />
                                            </div>
                                        ))
                                    ) : (
                                        row1.map((movie) => (
                                            <div key={movie.id} className="horizontal-scroll-card">
                                                <MovieCard
                                                    movie={movie}
                                                    onClick={(movie) => {
                                                        router.push(`/movie/${(movie.slug || movie.id).replace(/\s+/g, '-')}`);
                                                    }}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mobile-scroll-row" style={{ display: 'flex', width: '100%', gap: '12px', overflowX: 'auto', padding: '0 4px' }}>
                                    {loading ? (
                                        [...Array(4)].map((_, i) => (
                                            <div key={i} className="horizontal-scroll-card">
                                                <MovieCardSkeleton />
                                            </div>
                                        ))
                                    ) : (
                                        row2.map((movie) => (
                                            <div key={movie.id} className="horizontal-scroll-card">
                                                <MovieCard
                                                    movie={movie}
                                                    onClick={(movie) => router.push(`/movie/${(movie.slug || movie.id).replace(/\s+/g, '-')}`)}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {isScrollable && !loading && isHovering && (
                    <button
                        onClick={() => scroll('right')}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 20,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            borderRadius: '50%',
                            padding: '10px',
                            cursor: 'pointer',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: showRightButton ? 1 : 0.3,
                            transition: 'opacity 0.2s'
                        }}
                        className="scroll-btn"
                    >
                        <ChevronRight size={24} />
                    </button>
                )}
            </div>
            <style jsx>{`
                .horizontal-scroll-layout::-webkit-scrollbar {
                    display: none;
                }
                .section-mobile-layout {
                    display: none;
                }
                .section-desktop-layout {
                    display: block;
                }
                @media (max-width: 768px) {
                    .section-mobile-layout {
                        display: block;
                    }
                    .section-desktop-layout {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default HorizontalScrollSection;
