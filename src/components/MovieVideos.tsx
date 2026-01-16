"use client";

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { Video } from '../types';
import { getYoutubeId } from '../utils/videoUtils';

interface MovieVideosProps {
    videos: Video[];
    trailerUrl?: string;
    posterUrl: string;
    onPlayClick: (url: string) => void;
}

const MovieVideos: React.FC<MovieVideosProps> = ({ videos, trailerUrl, posterUrl, onPlayClick }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Combine trailer and other videos
    const allVideos: any[] = [];
    if (trailerUrl) {
        allVideos.push({
            id: 'trailer',
            title: 'Official Trailer',
            videoUrl: trailerUrl,
            thumbnailUrl: '', // Let the mapper handle it
            duration: 'Trailer'
        });
    }
    if (videos) {
        // Filter out any video that has the same URL as the main trailer to avoid duplicates
        const distinctVideos = videos.filter(v => v.videoUrl !== trailerUrl);
        allVideos.push(...distinctVideos);
    }

    const [isHovering, setIsHovering] = React.useState(false);

    if (allVideos.length === 0) return null;

    return (
        <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div style={{ marginBottom: '1rem' }}>
                <h2 style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    margin: 0,
                    borderLeft: '4px solid var(--primary-color)',
                    paddingLeft: '1rem'
                }}>
                    Videos
                </h2>
            </div>

            {allVideos.length > 3 && isHovering && (
                <button
                    onClick={() => scroll('left')}
                    style={{
                        position: 'absolute',
                        left: '-20px',
                        top: '60%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.7)',
                        border: '1px solid #444',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(4px)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = 'black';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)';
                        e.currentTarget.style.color = 'white';
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            <div
                ref={scrollContainerRef}
                className="cast-scroll-container"
                style={{
                    display: 'flex',
                    gap: '1.5rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollBehavior: 'smooth'
                }}
            >
                {allVideos.map(video => {
                    const videoId = getYoutubeId(video.videoUrl);
                    const thumbnailUrl = video.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : posterUrl);

                    return (
                        <div
                            key={video.id}
                            onClick={() => onPlayClick(video.videoUrl)}
                            style={{
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                minWidth: '280px',
                                maxWidth: '280px', // Enforce max width
                                flex: '0 0 auto'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{
                                position: 'relative',
                                paddingTop: '56.25%',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                marginBottom: '0.5rem',
                                backgroundColor: '#333'
                            }}>
                                <img
                                    src={thumbnailUrl}
                                    alt={video.title}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                        // Fallback if maxresdefault doesn't exist (some videos only have hqdefault)
                                        const target = e.target as HTMLImageElement;
                                        if (videoId && target.src.includes('maxresdefault')) {
                                            target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                        } else {
                                            target.src = posterUrl;
                                        }
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    borderRadius: '50%',
                                    padding: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Play size={24} fill="white" />
                                </div>
                                {(() => {
                                    let badgeText = video.duration;
                                    // Rule: If there are multiple videos, only the explicit main Trailer (id='trailer')
                                    // should keep the 'Trailer' text. Others labeled 'Trailer' are likely mislabeled or secondary.
                                    if (allVideos.length > 1 && video.id !== 'trailer' && badgeText === 'Trailer') {
                                        return null;
                                    }

                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '8px',
                                            right: '8px',
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {badgeText}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {allVideos.length > 3 && isHovering && (
                <button
                    onClick={() => scroll('right')}
                    style={{
                        position: 'absolute',
                        right: '-20px',
                        top: '60%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.7)',
                        border: '1px solid #444',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(4px)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = 'black';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)';
                        e.currentTarget.style.color = 'white';
                    }}
                >
                    <ChevronRight size={24} />
                </button>
            )}
        </div>
    );
};

export default MovieVideos;
