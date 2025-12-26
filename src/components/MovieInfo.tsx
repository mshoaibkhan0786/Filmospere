import React from 'react';
import type { Movie } from '../types';
import { ExternalLink, Star } from 'lucide-react';
import { PLATFORM_LOGOS, PLATFORM_THEMES } from '../constants';

interface MovieInfoProps {
    movie: Movie;
    showTitle?: boolean;
}

const MovieInfo: React.FC<MovieInfoProps> = ({ movie, showTitle = true }) => {
    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    {showTitle && (
                        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem' }}>{movie.title}</h1>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span>{movie.releaseYear}</span>
                        <span>•</span>
                        <span>{movie.tags.join(', ')}</span>
                        <span>•</span>
                        <span>{movie.views.toLocaleString()} views</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            <Star size={16} fill="gold" color="gold" />
                            {movie.rating}/10
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            ({movie.voteCount >= 1000 ? (movie.voteCount / 1000).toFixed(1) + 'k' : movie.voteCount} votes)
                        </div>
                    </div>
                </div>
            </div>

            <p style={{ lineHeight: '1.6', fontSize: '1.1rem', color: '#ddd', marginBottom: '2rem' }}>
                {movie.description}
            </p>

            {!movie.isCopyrightFree && movie.streamingLinks.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: '1rem' }}>Watch Now</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {movie.streamingLinks.map((link, idx) => {
                            const theme = PLATFORM_THEMES[link.platform];
                            const logoUrl = theme ? theme.logo : PLATFORM_LOGOS[link.platform];
                            const bgColor = theme ? theme.color : '#333';

                            return (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        backgroundColor: bgColor,
                                        padding: theme ? '10px 24px' : '10px 20px',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s',
                                        color: theme?.textColor || 'white',
                                        textDecoration: 'none',
                                        minWidth: theme ? '120px' : 'auto',
                                        height: '40px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                                    onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                                >
                                    <ExternalLink size={18} style={{ flexShrink: 0 }} />
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                        Watch on
                                        <img
                                            src={logoUrl}
                                            alt={link.platform}
                                            style={{
                                                height: '20px',
                                                marginTop: '2px',
                                                filter: (link.platform === 'Amazon Prime Video' || link.platform === 'Hulu') ? 'brightness(0) invert(1)' :
                                                    (logoUrl && logoUrl.includes('FFFFFF') ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none')
                                            }}
                                        />
                                    </span>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}

            {!movie.isCopyrightFree && movie.streamingLinks.length === 0 && (
                <div style={{ padding: '1rem', backgroundColor: '#222', borderRadius: '8px', textAlign: 'center', color: '#888' }}>
                    No streaming links available currently.
                </div>
            )}
        </div>
    );
};

export default MovieInfo;
