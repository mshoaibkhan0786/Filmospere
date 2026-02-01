"use client";

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { CastMember } from '../types';

import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { createSlug, extractIdFromSlug } from '../utils/formatUtils';

interface MovieCastProps {
    cast: CastMember[];
}

const MovieCast: React.FC<MovieCastProps> = ({ cast }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = React.useState(false);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!cast || cast.length === 0) return null;

    // Show all cast members
    const visibleCast = cast;

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
                    Top Cast
                </h2>
            </div>

            {visibleCast.length > 5 && isHovering && (
                <button
                    onClick={() => scroll('left')}
                    style={{
                        position: 'absolute',
                        left: '-20px',
                        top: '60%', // Adjusted for better alignment with content
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
                        color: 'white'
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
                    gap: '3rem', // Increased gap for better spacing
                    width: '100%',
                    overflowX: 'auto',
                    padding: '1rem', // Added padding all around to prevent clipping of scaled items
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                {visibleCast.map((member, idx) => (
                    <CastCard key={`${member.name}-${idx}`} member={member} />
                ))}
            </div>

            {visibleCast.length > 5 && isHovering && (
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
                        color: 'white'
                    }}
                >
                    <ChevronRight size={24} />
                </button>
            )}
        </div>
    );
};

const CastCard: React.FC<{ member: CastMember }> = ({ member }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);

    // Generate cleaner URL
    const rawId = extractIdFromSlug(member.id);
    const slug = createSlug(member.name);
    const personLink = `/person/${slug}-${rawId}`;

    return (
        <Link href={personLink} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
                className="cast-card"
                style={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: isHovered ? 10 : 0
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0 auto 1rem auto',
                    backgroundColor: '#333',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.5)' : 'none',
                    border: isHovered ? '2px solid var(--primary-color)' : '2px solid transparent',
                    boxSizing: 'border-box',
                    position: 'relative' // Ensure relative for absolute skeleton
                }}>
                    {!imageLoaded && !hasError && member.imageUrl && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#2a2a2a',
                            zIndex: 2
                        }}>
                            <div className="skeleton-shimmer" style={{ width: '100%', height: '100%' }} />
                        </div>
                    )}

                    {member.imageUrl && !hasError ? (
                        <Image
                            src={getOptimizedImageUrl(member.imageUrl, 200)}
                            alt={member.name}
                            fill
                            sizes="(max-width: 768px) 100px, 140px"
                            onLoad={() => setImageLoaded(true)}
                            onError={() => {
                                setHasError(true);
                                setImageLoaded(true);
                            }}
                            style={{
                                objectFit: 'cover',
                                opacity: imageLoaded ? 1 : 0,
                                transition: 'opacity 0.3s ease'
                            }}
                            unoptimized={true}
                        />
                    ) : (
                        <div className="flex-center" style={{ width: '100%', height: '100%', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={40} />
                        </div>
                    )}
                </div>
                <h4 style={{
                    margin: '0 0 0.25rem 0',
                    fontSize: '1rem',
                    color: isHovered ? 'var(--primary-color)' : 'white',
                    transition: 'color 0.3s ease'
                }}>
                    {member.name}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.role}</p>
            </div>
        </Link>
    );
};

export default MovieCast;
