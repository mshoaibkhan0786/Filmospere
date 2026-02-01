"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Play } from 'lucide-react';
import Image from 'next/image';
import { formatDuration, formatDate } from '../utils/formatUtils';
import type { Season } from '../types';

interface MovieSeasonsProps {
    seasons: Season[];
}

const MovieSeasons: React.FC<MovieSeasonsProps> = ({ seasons }) => {
    // 1. Extreme safety filter
    const validSeasons = React.useMemo(() => {
        if (!Array.isArray(seasons)) return [];
        return seasons.filter(s => s && typeof s === 'object' && Array.isArray(s.episodes) && s.episodes.length > 0);
    }, [seasons]);

    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
    const [visibleEpisodes, setVisibleEpisodes] = useState(15);
    const closeTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (validSeasons.length > 0) {
            // Ensure we pick a valid season number present in the data
            const first = validSeasons[0];
            if (first && typeof first.seasonNumber === 'number') {
                setSelectedSeason(first.seasonNumber);
            }
        }
    }, [validSeasons]);

    useEffect(() => {
        setVisibleEpisodes(15);
    }, [selectedSeason]);

    if (!validSeasons || validSeasons.length === 0) {
        return null; // Return null safely if no valid data
    }

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsSeasonDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setIsSeasonDropdownOpen(false);
        }, 100);
    };

    // Safe Find
    const currentSeasonData = validSeasons.find(s => s.seasonNumber === selectedSeason);
    // Safe Episodes Access
    const currentEpisodes = currentSeasonData?.episodes || [];

    return (
        <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>Episodes</h2>
                <div
                    style={{ position: 'relative', minWidth: '150px' }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div style={{
                        backgroundColor: '#333',
                        color: 'white',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid transparent',
                        transition: 'background-color 0.2s, border-color 0.2s'
                    }}
                        onClick={() => setIsSeasonDropdownOpen(prev => !prev)}
                    >
                        <span>Season {selectedSeason}</span>
                        <ChevronDown size={16} style={{
                            transform: isSeasonDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                        }} />
                    </div>

                    {isSeasonDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: '#2a2a2a',
                            borderRadius: '6px',
                            marginTop: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            zIndex: 20,
                            overflow: 'hidden',
                            border: '1px solid #444'
                        }}>
                            {validSeasons.map(season => (
                                <div
                                    key={season.seasonNumber || Math.random()}
                                    onClick={() => {
                                        if (season.seasonNumber) setSelectedSeason(season.seasonNumber);
                                        setIsSeasonDropdownOpen(false);
                                    }}
                                    style={{
                                        padding: '10px 16px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedSeason === season.seasonNumber ? '#444' : 'transparent',
                                        color: selectedSeason === season.seasonNumber ? 'var(--primary-color)' : 'white',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        if (selectedSeason !== season.seasonNumber) {
                                            e.currentTarget.style.backgroundColor = '#3a3a3a';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (selectedSeason !== season.seasonNumber) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    Season {season.seasonNumber}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="episodes-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentEpisodes.slice(0, visibleEpisodes).map((episode, index) => {
                    // Extra safety for episode object
                    if (!episode) return null;

                    return (
                        <div key={episode.id || index} style={{
                            display: 'flex',
                            gap: '1rem',
                            backgroundColor: '#222',
                            padding: '1rem',
                            borderRadius: '8px',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{
                                width: '160px',
                                height: '90px',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                backgroundColor: '#333',
                                position: 'relative'
                            }}>
                                {episode.thumbnailUrl ? (
                                    <Image
                                        src={episode.thumbnailUrl}
                                        alt={episode.title || 'Episode'}
                                        fill
                                        sizes="(max-width: 768px) 120px, 160px"
                                        style={{ objectFit: 'cover' }}
                                        unoptimized={true}
                                    />
                                ) : (
                                    <div className="flex-center" style={{ width: '100%', height: '100%', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Play size={32} />
                                    </div>
                                )}
                                {episode.duration && (
                                    <div style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 4px', borderRadius: '2px', fontSize: '0.7rem' }}>
                                        {formatDuration(episode.duration)}
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{index + 1}. {episode.title || `Episode ${index + 1}`}</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#aaa', lineHeight: '1.4' }}>
                                    {episode.description ? episode.description : (episode.releaseDate ? `Released: ${formatDate(episode.releaseDate)}` : '')}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {currentEpisodes.length > visibleEpisodes && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <button
                        onClick={() => setVisibleEpisodes(prev => prev + 15)}
                        style={{
                            padding: '10px 30px',
                            backgroundColor: 'transparent',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.4)',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'white';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                        }}
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
};

export default MovieSeasons;
