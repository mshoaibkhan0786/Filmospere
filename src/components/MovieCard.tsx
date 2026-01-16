import React, { useState } from 'react';

import type { Movie } from '../types';
import { Play, ImageOff, Star } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatDuration } from '../utils/formatUtils';

interface MovieCardProps {
    movie: Movie;
    onClick: (movie: Movie) => void;
    priority?: boolean; // If true, load image immediately (eager)
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, priority = false }) => {
    const [imgError, setImgError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    // Fallback Logic: Start with optimized, fallback to original on error
    const [imgSrc, setImgSrc] = useState(getOptimizedImageUrl(movie.posterUrl, 400));

    // Handle Image Error: Try original URL if optimized fails
    const handleError = () => {
        if (imgSrc !== movie.posterUrl) {
            // If current failed src is NOT the original, try the original
            setImgSrc(movie.posterUrl);
        } else {
            // If original also failed, show error placeholder
            setImgError(true);
        }
    };

    // Safe access to tags
    const tags = movie.tags || [];

    return (
        <div
            className="movie-card"
            onClick={() => onClick(movie)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'relative',
                aspectRatio: '2/3',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                zIndex: isHovered ? 10 : 1,
                boxShadow: isHovered ? '0 10px 30px rgba(0,0,0,0.5)' : '0 2px 10px rgba(0,0,0,0.2)',
                backgroundColor: '#1a1a1a', // Fallback color
                overflow: 'hidden' // Keeps the image corners rounded
            }}
        >
            {/* Poster Image */}
            <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#2a2a2a' }}>
                {!imgError && movie.posterUrl ? (
                    <>
                        {/* 
                            Using standard <img> tag instead of next/image to match Vite version behavior 
                            and eliminate flicker during infinite scroll updates.
                        */}
                        <img
                            ref={(el) => {
                                // Double check on mount/ref assignment
                                if (el && el.complete && !isImageLoaded) {
                                    setIsImageLoaded(true);
                                }
                            }}
                            src={imgSrc}
                            alt={movie.title}
                            width="400"
                            height="600"
                            loading={priority ? "eager" : "lazy"}
                            onLoad={() => setIsImageLoaded(true)}
                            onError={handleError}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'filter 0.3s, opacity 0.5s ease-in-out',
                                filter: isHovered ? 'brightness(0.7)' : 'brightness(1)',
                                opacity: isImageLoaded ? 1 : 0
                            }}
                        />
                        {!isImageLoaded && (
                            <div className="skeleton-shimmer" style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                zIndex: 1
                            }} />
                        )}
                    </>
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #333 0%, #111 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: '#666'
                    }}>
                        <ImageOff size={32} />
                    </div>
                )}
            </div>

            {/* Content Overlay (Visible on Hover) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    padding: '1rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 50%, transparent 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.3s ease-in-out',
                    height: '100%', // Cover full height to allow gradient to be smooth
                    boxSizing: 'border-box'
                }}
            >
                {/* Play Button */}
                <div style={{
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    }}>
                        <Play size={16} fill="black" color="black" style={{ marginLeft: '2px' }} />
                    </div>
                    {movie.isCopyrightFree && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff' }}>Free</span>
                    )}
                </div>

                {/* Title */}
                <h3 style={{
                    margin: '0 0 4px 0',
                    fontSize: '1rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: 'white'
                }}>
                    {movie.title}
                </h3>

                {/* Meta Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e5b109' }}>
                        <Star size={12} fill="#e5b109" />
                        <span>{movie.rating ? Number(movie.rating).toFixed(1) : 'NR'}</span>
                    </div>
                    <span style={{ color: '#ccc' }}>{movie.releaseYear}</span>
                    {formatDuration(movie.duration) && formatDuration(movie.duration) !== '0 min' && formatDuration(movie.duration) !== 'N/A' && (
                        <>
                            <span style={{ color: '#666', fontSize: '0.6rem' }}>•</span>
                            <span style={{ color: '#ccc' }}>{formatDuration(movie.duration)}</span>
                        </>
                    )}
                </div>

                {/* Genres */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {tags.slice(0, 3).map((tag, i) => (
                        <span key={i} style={{ fontSize: '0.75rem', color: '#ccc' }}>
                            {tag}{i < Math.min(tags.length, 3) - 1 ? ' • ' : ''}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
