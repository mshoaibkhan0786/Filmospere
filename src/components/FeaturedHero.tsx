"use client";

import React, { useState } from 'react';
import { Play, Star, Info, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Movie } from '../types';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatDuration } from '../utils/formatUtils';
import { getYoutubeId } from '../utils/videoUtils';

interface FeaturedHeroProps {
    movie: Movie;
}

const FeaturedHero: React.FC<FeaturedHeroProps> = ({ movie }) => {
    const router = useRouter();
    const [playingTrailerId, setPlayingTrailerId] = useState<string | null>(null);

    // Prefer the first image (Banner) if available, otherwise fallback to poster
    const bannerUrl = movie.images && movie.images.length > 0 ? movie.images[0] : movie.posterUrl;

    const handlePlayClick = () => {
        if (movie.trailerUrl) {
            const youtubeId = getYoutubeId(movie.trailerUrl);
            if (youtubeId) {
                setPlayingTrailerId(youtubeId);
                return;
            }
        }
        router.push(`/movie/${movie.id}`);
    };

    return (
        <div className="movie-hero-container" style={{
            position: 'relative',
            minHeight: '85vh', // Allow growth
            width: '100%',
            marginBottom: '-10vh', // Negative margin to blend with content below
            userSelect: 'none'
        }}>
            {/* Background Image */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url("${getOptimizedImageUrl(bannerUrl, 1920)}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
            }}>
                {/* Gradient Overlays */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to right, rgba(20,20,20,0.9) 0%, rgba(20,20,20,0.6) 30%, rgba(20,20,20,0) 100%)',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '40%',
                    background: 'linear-gradient(to top, #141414 0%, rgba(20,20,20,0) 100%)',
                }} />
            </div>

            {/* Content Container */}
            <div className="container" style={{
                position: 'relative',
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                zIndex: 10,
                paddingTop: '150px', // Clear navbar
                paddingBottom: '15vh' // Ensure content is above the negative margin overlap
            }}>
                <div style={{ maxWidth: '600px' }}>

                    {/* Title */}
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: '800',
                        marginBottom: '1rem',
                        lineHeight: 1.1,
                        textShadow: '2px 4px 8px rgba(0,0,0,0.6)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {movie.title}
                    </h1>

                    {/* Metadata */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '1.5rem',
                        marginTop: '0.5rem',
                        marginBottom: '1.5rem',
                        color: '#e5e5e5',
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        {/* Year */}
                        <span>{movie.releaseYear}</span>

                        {/* Separator */}
                        <span style={{ width: '4px', height: '4px', background: '#ccc', borderRadius: '50%' }}></span>

                        {/* Duration */}
                        <span>{formatDuration(movie.duration)}</span>

                        {/* Separator */}
                        <span style={{ width: '4px', height: '4px', background: '#ccc', borderRadius: '50%' }}></span>

                        {/* Rating */}
                        {movie.rating > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Star fill="#e5b109" color="#e5b109" size={20} />
                                <span style={{ color: '#e5b109', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    {movie.rating.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <p style={{
                        fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
                        color: '#f5f5f5',
                        marginBottom: '2rem',
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textShadow: '1px 2px 4px rgba(0,0,0,0.8)'
                    }}>
                        {movie.description}
                    </p>

                    {/* Buttons */}
                    <div className="featured-actions-container">
                        <button
                            onClick={handlePlayClick}
                            className="movie-hero-play-button"
                        >
                            <Play fill="black" size={24} />
                            Play Trailer
                        </button>

                        <button
                            onClick={() => router.push(`/movie/${(movie.slug || movie.id).replace(/\s+/g, '-')}`)}
                            className="movie-hero-trailer-button"
                        >
                            <Info size={24} />
                            More Info
                        </button>
                    </div>
                </div>
            </div>
            {playingTrailerId && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'black',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={() => setPlayingTrailerId(null)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid white',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            zIndex: 10001
                        }}
                    >
                        <X size={24} />
                    </button>
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${playingTrailerId}?autoplay=1&rel=0`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ border: 'none' }}
                    ></iframe>
                </div>
            )}
        </div>
    );
};

export default FeaturedHero;
