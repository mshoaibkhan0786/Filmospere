"use client";

import React, { useState, useRef } from 'react';
import { Play, Info, Star, Plus, Check, Volume2, VolumeX, MonitorPlay, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie } from '../types';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatDuration, formatVoteCount } from '../utils/formatUtils';

interface MovieHeroProps {
    movie: Movie;
    onPlayClick: (url: string) => void;
}

const MovieHero: React.FC<MovieHeroProps> = ({ movie, onPlayClick }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showRatingDetails, setShowRatingDetails] = useState(false);
    const ratingRef = useRef<HTMLDivElement>(null);

    // Close rating details on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ratingRef.current && !ratingRef.current.contains(event.target as Node)) {
                setShowRatingDetails(false);
            }
        };

        if (showRatingDetails) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showRatingDetails]);

    // Detect Mobile Viewport
    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Use images array (Backdrops) for both Desktop and Mobile (Traditional Layout)
    // If no backdrops exist, fallback to poster.
    const images = movie.images && movie.images.length > 0 ? movie.images : (movie.backdropUrl ? [movie.backdropUrl] : [movie.posterUrl]);

    const handleNextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Wheel/Touchpad Scroll Handler
    const handleWheel = (e: React.WheelEvent) => {
        if (Math.abs(e.deltaX) > 50) { // Threshold to prevent sensitive triggering
            if (e.deltaX > 0) {
                handleNextImage();
            } else {
                handlePrevImage();
            }
        }
    };

    // Touch Handling for Mobile Swipe
    const touchStartX = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX.current) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;

        if (Math.abs(diff) > 50) { // Swipe threshold
            if (diff > 0) {
                handleNextImage();
            } else {
                handlePrevImage();
            }
        }
        touchStartX.current = null;
    };

    // Mobile View: Split Layout (Hotstar Style)
    if (isMobile) {
        return (
            <div className="movie-hero-container" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#141414', minHeight: 'auto', marginBottom: 0 }}>
                {/* 1. Backdrop Image Block (16:9) */}
                <div style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url("${getOptimizedImageUrl(images[currentImageIndex], 780)}")`, // Lower res for mobile is fine
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    {/* Gradient to blend image bottom into content */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '40%',
                        background: 'linear-gradient(to bottom, transparent 0%, #141414 100%)'
                    }} />
                </div>

                {/* 2. Content Block */}
                <div style={{ padding: '0 1rem 0 1rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '-1rem', position: 'relative', zIndex: 10, alignItems: 'center', textAlign: 'center' }}>
                    {/* Title */}
                    <h1 className="movie-hero-title" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.2rem', lineHeight: '1.2', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        {movie.title}
                    </h1>

                    {/* Metadata Row - Centered */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1rem', color: '#ccc', fontSize: '0.95rem', fontWeight: 500 }}>
                        <span>{movie.releaseYear}</span>
                        <span>
                            {movie.contentType === 'series' || movie.seasons?.length ? (
                                (() => {
                                    const seasonsText = String(movie.totalSeasons || movie.seasons?.length || '?');
                                    if (seasonsText.toLowerCase().includes('season')) return seasonsText;
                                    const count = parseFloat(seasonsText);
                                    return count === 1 ? `${seasonsText} Season` : `${seasonsText} Seasons`;
                                })()
                            ) : (
                                formatDuration(movie.duration)
                            )}
                        </span>
                        {movie.rating > 0 && (
                            <div
                                ref={ratingRef}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative', cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowRatingDetails(prev => !prev);
                                }}
                            >
                                <Star fill="#e5b109" color="#e5b109" size={16} />
                                <span style={{ color: '#e5b109', fontWeight: 'bold' }}>
                                    {movie.rating.toFixed(1)}
                                </span>

                                {showRatingDetails && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '120%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'rgba(20, 20, 20, 0.95)',
                                        border: '1px solid #333',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        zIndex: 50,
                                        width: 'max-content',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', marginBottom: '2px' }}>Filmospere Score</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff' }}>
                                            {movie.rating.toFixed(1)}/10 <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '400' }}>({formatVoteCount(movie.voteCount)} votes)</span>
                                        </div>
                                        {/* Tiny arrow at bottom */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-5px',
                                            left: '50%',
                                            transform: 'translateX(-50%) rotate(45deg)',
                                            width: '8px',
                                            height: '8px',
                                            background: 'rgba(20, 20, 20, 0.95)',
                                            borderRight: '1px solid #333',
                                            borderBottom: '1px solid #333'
                                        }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Share Button (Mobile Only) */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const shareData = {
                                    title: movie.title,
                                    text: `Check out ${movie.title} on Filmospere!`,
                                    url: window.location.href
                                };
                                if (navigator.share) {
                                    navigator.share(shareData).catch(console.error);
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    // Optional: You could show a toast here
                                }
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ccc',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                padding: '4px',
                                marginLeft: '0.5rem'
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ transform: 'scaleX(-1)' }}
                            >
                                <path
                                    d="M10 9V5L3 12L10 19V14.9C15 14.9 18.5 16.5 21 20C20 15 17 10 10 9Z"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', width: '100%' }}>
                        {(() => {
                            let validTrailerUrl = movie.trailerUrl;
                            if (!validTrailerUrl && movie.videos && movie.videos.length > 0) {
                                const trailerVideo = movie.videos.find(v => v.title && v.title.toLowerCase().includes('trailer'));
                                validTrailerUrl = trailerVideo ? trailerVideo.videoUrl : movie.videos[0].videoUrl;
                            }

                            return (
                                <>
                                    {movie.isCopyrightFree && movie.videoUrl && (
                                        <button
                                            onClick={() => onPlayClick(movie.videoUrl!)}
                                            className="movie-hero-play-button"
                                            style={{ flex: 1, padding: '0.8rem', fontSize: '1.1rem' }}
                                        >
                                            <Play fill="black" size={22} />
                                            Play
                                        </button>
                                    )}
                                    {validTrailerUrl && (
                                        <button
                                            onClick={() => onPlayClick(validTrailerUrl!)}
                                            className="movie-hero-trailer-button"
                                            style={{ flex: 1, padding: '0.8rem', fontSize: '1.1rem', justifyContent: 'center' }}
                                        >
                                            <MonitorPlay size={22} />
                                            Trailer
                                        </button>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    {/* Short Desc - Standard Style */}
                    <p style={{
                        fontSize: '1.1rem', // Increased size as requested
                        lineHeight: '1.6',
                        color: '#d1d1d1',
                        marginTop: '0.25rem',
                        marginBottom: '0.5rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textAlign: 'center',
                        fontFamily: 'inherit',
                        opacity: 0.95
                    }}>
                        {movie.metaDescription || (movie.description ? (movie.description.length > 150 ? movie.description.substring(0, 150) + '...' : movie.description) : '')}
                    </p>
                </div>
            </div>
        );
    }

    // Desktop View: Traditional Overlay
    return (
        <div
            className="movie-hero-container"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onWheel={handleWheel}
        // Mobile touch events not strictly needed for desktop, but harmless
        >
            {/* Background Images with Transition */}
            {images.map((img, index) => (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url("${getOptimizedImageUrl(img, 1920)}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: '50% 15%',
                        opacity: currentImageIndex === index ? 1 : 0,
                        transition: 'opacity 0.8s ease-in-out',
                        zIndex: 1
                    }}
                />
            ))}

            {/* Gradient Overlays */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '70%', zIndex: 2, background: 'linear-gradient(to top, #141414 0%, rgba(20,20,20,0.8) 30%, transparent 100%)' }} />

            {/* Navigation Arrows (visible on hover) */}
            {images.length > 1 && isHovering && (
                <>
                    <button
                        onClick={handlePrevImage}
                        style={{
                            position: 'absolute',
                            left: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 20,
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            borderRadius: '50%',
                            padding: '10px',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button
                        onClick={handleNextImage}
                        style={{
                            position: 'absolute',
                            right: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 20,
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            borderRadius: '50%',
                            padding: '10px',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        <ChevronRight size={32} />
                    </button>

                    {/* Dots Indicator */}
                    <div style={{
                        position: 'absolute',
                        bottom: '120px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '8px',
                        zIndex: 20
                    }}>
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: currentImageIndex === idx ? 'white' : 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex(idx);
                                }}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Content Container */}
            <div className="container" style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10,
                paddingBottom: '15vh',
                paddingTop: '80px' // Prevent overlap with Navbar
            }}>
                <div className="movie-hero-title-wrapper" style={{ maxWidth: '800px', marginBottom: '2rem', marginTop: 'auto' }}>
                    {/* Title */}
                    <h1 className="movie-hero-title" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>
                        {movie.title}
                    </h1>

                    {/* Metadata Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', color: '#e5e5e5', fontSize: '1.1rem', fontWeight: 500, textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}>
                        <span>{movie.releaseYear}</span>
                        <span>
                            {movie.contentType === 'series' || movie.seasons?.length ? (
                                (() => {
                                    const seasonsText = String(movie.totalSeasons || movie.seasons?.length || '?');
                                    if (seasonsText.toLowerCase().includes('season')) return seasonsText;
                                    const count = parseFloat(seasonsText);
                                    return count === 1 ? `${seasonsText} Season` : `${seasonsText} Seasons`;
                                })()
                            ) : (
                                formatDuration(movie.duration)
                            )}
                        </span>
                        {movie.rating > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Star fill="#e5b109" color="#e5b109" size={18} />
                                <span style={{ color: '#e5b109', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    {movie.rating.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description - Brief */}
                    <p style={{
                        fontSize: '1.2rem',
                        lineHeight: 1.5,
                        color: '#ddd',
                        marginBottom: '2rem',
                        maxWidth: '700px',
                        textShadow: '1px 2px 4px rgba(0,0,0,0.95)',
                    }}>
                        {movie.description || movie.metaDescription}
                    </p>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {(() => {
                            // Logic: 
                            // 1. Explicit 'trailerUrl' property
                            // 2. Search 'videos' for item with "Trailer" in title
                            // 3. Fallback to first video in array
                            let validTrailerUrl = movie.trailerUrl;

                            if (!validTrailerUrl && movie.videos && movie.videos.length > 0) {
                                const trailerVideo = movie.videos.find(v => v.title && v.title.toLowerCase().includes('trailer'));
                                validTrailerUrl = trailerVideo ? trailerVideo.videoUrl : movie.videos[0].videoUrl;
                            }

                            if (movie.isCopyrightFree && movie.videoUrl) {
                                return (
                                    <>
                                        <button
                                            onClick={() => onPlayClick(movie.videoUrl!)}
                                            className="movie-hero-play-button"
                                        >
                                            <Play fill="black" size={24} />
                                            Play
                                        </button>
                                        {/* Show Trailer button as secondary if BOTH exist */}
                                        {validTrailerUrl && (
                                            <button
                                                onClick={() => onPlayClick(validTrailerUrl!)}
                                                className="movie-hero-trailer-button"
                                            >
                                                <MonitorPlay size={24} />
                                                Trailer
                                            </button>
                                        )}
                                    </>
                                );
                            } else if (validTrailerUrl) {
                                return (
                                    <button
                                        onClick={() => onPlayClick(validTrailerUrl!)}
                                        className="movie-hero-play-button"
                                    >
                                        <Play fill="black" size={24} />
                                        Play Trailer
                                    </button>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieHero;
