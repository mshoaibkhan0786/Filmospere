"use client";

import React, { useState, useRef } from 'react';
import { Play, Star, MonitorPlay, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie } from '../types';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatDuration } from '../utils/formatUtils';

interface MovieHeroProps {
    movie: Movie;
    onPlayClick: (url: string) => void;
}

const MovieHero: React.FC<MovieHeroProps> = ({ movie, onPlayClick }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect Mobile Viewport
    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Use images array (Backdrops) for Desktop, but strictly use Poster for Mobile to ensure subject focus
    const images = isMobile
        ? [movie.posterUrl]
        : (movie.images && movie.images.length > 0 ? movie.images : [movie.posterUrl]);

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

    return (
        <div
            className="movie-hero-container"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
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
                        backgroundPosition: '50% 15%', // Slightly down from top to center faces better, but definitely biased to top
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
        </div >
    );
};

export default MovieHero;
