"use client";

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './MovieCardSkeleton';
import type { Movie } from '../types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
                {linkTo && !loading ? (
                    <Link href={linkTo} style={{ textDecoration: 'none', color: 'white' }}>
                        <h2
                            style={{
                                fontSize: '1.8rem',
                                fontWeight: 'bold',
                                margin: 0,
                                borderLeft: '4px solid var(--primary-color)',
                                paddingLeft: '1rem',
                                cursor: 'pointer',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#e50914'}
                            onMouseLeave={e => e.currentTarget.style.color = 'white'}
                        >
                            {title}
                        </h2>
                    </Link>
                ) : (
                    <h2
                        style={{
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            margin: 0,
                            borderLeft: '4px solid var(--primary-color)',
                            paddingLeft: '1rem',
                            cursor: 'default',
                            transition: 'color 0.2s'
                        }}
                    >
                        {title}
                    </h2>
                )}
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
                    <div className="mobile-scroll-container">
                        <div className="mobile-scroll-grid">
                            {loading ? (
                                [...Array(8)].map((_, i) => (
                                    <div key={i} className="horizontal-scroll-card">
                                        <MovieCardSkeleton />
                                    </div>
                                ))
                            ) : (
                                data.slice(0, 20).map((movie) => (
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
                /* Grid Layout for Mobile (Unified Scroll) */
                .mobile-scroll-grid {
                    display: grid;
                    grid-template-rows: repeat(2, 1fr); /* 2 Rows fix */
                    grid-auto-flow: column; /* Fill columns first */
                    gap: 12px;
                    overflow-x: auto;
                    padding-right: 4px; /* Minimal end padding */
                    padding-bottom: 12px;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .mobile-scroll-grid::-webkit-scrollbar {
                    display: none;
                }

                /* Mobile Phone Width (<500px): 44% width = 2 cards + peek */
                @media (max-width: 500px) {
                    .mobile-scroll-grid {
                        grid-auto-columns: 44%;
                    }
                }

                /* Tablet Width (>500px): 30% width = 3 cards + peek */
                @media (min-width: 501px) {
                    .mobile-scroll-grid {
                        grid-auto-columns: 30%;
                    }
                }

                .horizontal-scroll-card {
                    width: 100%;
                    height: 100%;
                }
            `}</style>
        </div>
    );
};

export default HorizontalScrollSection;
