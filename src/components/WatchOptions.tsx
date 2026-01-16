"use client";

import React, { useState } from 'react';
import type { Movie, StreamingLink } from '../types';

interface WatchOptionsProps {
    movie: Movie;
    selectedRegion: string;
    userRegion: string | null;
}

const WatchOptions: React.FC<WatchOptionsProps> = ({ movie, selectedRegion, userRegion }) => {
    const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

    const links = movie.streamingLinks || [];
    if (links.length === 0) return null;

    // Filter by selected region
    const availableRegions = Array.from(new Set(links.map(l => l.country || 'US'))).sort();
    let currentLinks = links.filter(l => (l.country || 'US') === selectedRegion);

    if (currentLinks.length === 0 && availableRegions.length > 0) {
        currentLinks = links.filter(l => (l.country || 'US') === availableRegions[0]);
    }

    // Normalize platform names
    const normalizePlatform = (p: string) => {
        const lower = p.toLowerCase().trim();
        if (lower.includes('amazon') || lower.includes('prime')) return 'amazon prime video';
        if (lower.includes('apple') || lower.includes('itunes')) return 'apple tv';
        if (lower.includes('google') || lower.includes('play movies')) return 'google play';
        if (lower.includes('youtube')) return 'youtube';
        if (lower.includes('disney')) return 'disney+';
        if (lower.includes('zee5')) return 'zee5';
        if (lower.includes('jio')) return 'jiocinema';
        return lower;
    };

    // Distinct deduplication logic using NORMALIZED names
    const uniqueLinksMap = new Map();
    currentLinks.forEach(link => {
        const type = link.type || 'flatrate';
        const p = normalizePlatform(link.platform);
        const key = `${p}-${type}`;

        if (!uniqueLinksMap.has(key)) {
            uniqueLinksMap.set(key, { ...link, type });
        }
    });
    const allLinks = Array.from(uniqueLinksMap.values()) as StreamingLink[];

    const streamTypes = ['flatrate', 'ads', 'free'];
    const streamingLinks = allLinks.filter(l => streamTypes.includes(l.type || ''));

    // Filter Rent/Buy
    const streamingPlatforms = new Set(streamingLinks.map(l => normalizePlatform(l.platform)));
    const rawRentBuyLinks = allLinks.filter(l => !streamTypes.includes(l.type || '') && !streamingPlatforms.has(normalizePlatform(l.platform)));

    // Deduplicate Rent/Buy
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const processedRentBuyLinks = (() => {
        const map = new Map();
        rawRentBuyLinks.forEach(link => {
            const p = normalizePlatform(link.platform);
            if (map.has(p)) {
                const existing = map.get(p);
                existing.type = 'merged';
            } else {
                map.set(p, { ...link });
            }
        });
        return Array.from(map.values()) as StreamingLink[];
    })();

    const rentBuyLinks = processedRentBuyLinks;

    if (streamingLinks.length === 0 && rentBuyLinks.length === 0) {
        return (
            <div style={{ marginBottom: '2rem' }}>
                <h2 className="watch-section-title">Where to Watch</h2>
                <div style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                    No streaming options available in this region.
                </div>
            </div>
        );
    }

    // Helper: Region Labels
    const getRegionLabel = (code: string) => {
        const map: Record<string, string> = { 'US': '🇺🇸 US', 'GB': '🇬🇧 UK', 'IN': '🇮🇳 India', 'AU': '🇦🇺 Australia', 'CA': '🇨🇦 Canada' };
        return map[code] || code;
    };

    // Helper: Platform Config
    const getPlatformConfig = (platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes('netflix')) return { color: '#E50914', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Logonetflix.png' };
        if (p.includes('prime') || p.includes('amazon')) return { color: '#00A8E1', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Amazon_Prime_Video_logo.svg/512px-Amazon_Prime_Video_logo.svg.png' };
        if (p.includes('hotstar') || p.includes('jiostar')) return { color: '#0f1014', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/JioHotstar_2025.png/1200px-JioHotstar_2025.png?20250530065522', hasWhiteShadow: true, noBorder: true };
        if (p.includes('disney')) return { color: '#113CCF', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney%2B_logo.svg/2560px-Disney%2B_logo.svg.png' };
        if (p.includes('hulu')) return { color: '#1CE783', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Hulu_Logo.svg/2560px-Hulu_Logo.svg.png' };
        if (p.includes('hbo') || p.includes('max')) return { color: '#5E26E3', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/HBO_Max_Logo.svg/2560px-HBO_Max_Logo.svg.png' };
        if (p.includes('apple')) return { color: '#ffffff', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Apple_TV_Plus_Logo.svg/2560px-Apple_TV_Plus_Logo.svg.png' };
        if (p.includes('peacock')) return { color: '#000000', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/NBCUniversal_Peacock_Logo.svg/2560px-NBCUniversal_Peacock_Logo.svg.png' };
        if (p.includes('google')) return { color: '#4285F4', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Google_Play_Arrow_logo.svg/512px-Google_Play_Arrow_logo.svg.png' };
        if (p.includes('zee5')) return { color: '#8230A8', logo: 'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/zee5-logo.png' };
        if (p.includes('vi') || p.includes('vodafone')) return { color: '#ED1C24', logo: '/vi-movies.svg', isVi: true };
        if (p.includes('jio')) return { color: '#D9008D', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/14/JioCinema_logo.svg/512px-JioCinema_logo.svg.png' };
        if (p.includes('sony')) return { color: '#F99D1C', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Sony_LIV_Logo_2020.svg/512px-Sony_LIV_Logo_2020.svg.png' };
        if (p.includes('lionsgate')) return { color: '#D4AF37', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Lionsgate_Play_logo.svg/512px-Lionsgate_Play_logo.svg.png' };
        if (p.includes('mubi')) return { color: '#001e62', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/MUBI_logo.svg/512px-MUBI_logo.svg.png' };
        if (p.includes('youtube')) return { color: '#FF0000', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/YouTube_Logo_2017.svg/2560px-YouTube_Logo_2017.svg.png' };
        if (p.includes('mx') && p.includes('player')) return { color: '#0084ff', logo: null };

        return { color: '#444', logo: null };
    };

    // Helper: Deep Links
    const generateDeepLink = (platform: string, originalUrl: string, title: string) => {
        if (!originalUrl || originalUrl.includes('jw-links')) return originalUrl;
        const p = platform.toLowerCase();
        const encodedTitle = encodeURIComponent(title);

        if (p.includes('netflix')) return `https://www.netflix.com/search?q=${encodedTitle}`;
        if (p.includes('prime') || p.includes('amazon')) return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodedTitle}`;
        if (p.includes('hotstar') || p.includes('jiostar')) return `https://www.hotstar.com/in/search?search_query=${encodedTitle}`;
        if (p.includes('disney')) return `https://www.disneyplus.com/search?q=${encodedTitle}`;
        if (p.includes('hulu')) return `https://www.hulu.com/search?q=${encodedTitle}`;
        if (p.includes('hbo') || p.includes('max')) return `https://www.max.com/search?q=${encodedTitle}`;
        if (p.includes('apple')) return `https://www.google.com/search?q=${encodedTitle}+apple+tv`;
        if (p.includes('youtube')) return `https://www.youtube.com/results?search_query=${encodedTitle}`;
        if (p.includes('google')) return `https://play.google.com/store/search?q=${encodedTitle}&c=movies`;
        if (p.includes('zee5')) return `https://www.zee5.com/search?q=${encodedTitle}`;
        if (p.includes('jio')) return `https://www.jiocinema.com/search/${encodedTitle}`;
        if (p.includes('sony')) return `https://www.sonyliv.com/search?q=${encodedTitle}`;
        if (p.includes('mx') && p.includes('player')) return `https://www.google.com/search?q=site:mxplayer.in+${encodedTitle}`;
        if (p.includes('lionsgate')) return `https://lionsgateplay.com/search?q=${encodedTitle}`;
        if (p.includes('mubi')) return `https://mubi.com/search/films?query=${encodedTitle}`;
        if (p.includes('peacock')) return `https://www.peacocktv.com/search?q=${encodedTitle}`;
        if (p.includes('vi') || p.includes('vodafone')) return `https://www.myvi.in/search?q=${encodedTitle}`;

        return originalUrl;
    };

    const renderLinks = (linkList: StreamingLink[], isCompact: boolean = false) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: isCompact ? '0.75rem' : '1rem', minHeight: '50px' }}>
            {linkList.map((link, index) => {
                const config = getPlatformConfig(link.platform);
                const isClickable = !!link.url;
                const finalUrl = isClickable ? generateDeepLink(link.platform, link.url, movie.title) : '#';

                // Determine Label and Color
                const typeLabel = link.type === 'rent' ? 'RENT' : link.type === 'buy' ? 'BUY' : null;

                let ribbonColor = '#2196F3'; // Default Blue
                if (typeLabel === 'BUY') ribbonColor = '#2ecc71';
                if (typeLabel === 'RENT') ribbonColor = '#f1c40f';

                const logoUrl = config.logo || (link.icon ? `https://image.tmdb.org/t/p/w92${link.icon}` : null);
                const isApple = link.platform.toLowerCase().includes('apple');
                // @ts-ignore
                const isVi = config.isVi || false;

                return (
                    <a
                        key={`${link.platform}-${index}-${link.type}`}
                        href={finalUrl}
                        target={isClickable ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="watch-link-button"
                        style={{
                            color: 'white',
                            /* @ts-ignore */
                            border: isApple ? '1px solid #e0e0e0' : (config.noBorder ? 'none' : `2px solid ${config.color}`),
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: isCompact ? '0 0.5rem' : '0 1rem',
                            minWidth: isCompact ? '80px' : '100px',
                            height: isCompact ? '32px' : '42px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            opacity: isClickable ? 1 : 0.7,
                            cursor: isClickable ? 'pointer' : 'default',
                            transition: 'all 0.2s ease',
                            backgroundColor: 'white',
                            boxShadow: 'none',
                        }}
                        onMouseEnter={e => {
                            if (!isClickable) return;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            /* @ts-ignore */
                            const shadowColor = config.hasWhiteShadow ? '#ffffff' : config.color;
                            e.currentTarget.style.boxShadow = `0 8px 25px -4px ${shadowColor}60`;
                        }}
                        onMouseLeave={e => {
                            if (isClickable) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }
                        }}
                        onMouseDown={e => {
                            if (!isClickable) return;
                            e.currentTarget.style.transform = 'translateY(1px)';
                        }}
                    >
                        {logoUrl && !failedLogos.has(link.platform) ? (
                            <img
                                src={logoUrl}
                                alt={link.platform}
                                style={{
                                    height: isCompact ? '18px' : '28px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    maxWidth: isCompact ? '60px' : isVi ? '120px' : '100px'
                                }}
                                onError={() => {
                                    setFailedLogos((prev) => {
                                        const newSet = new Set(prev);
                                        newSet.add(link.platform);
                                        return newSet;
                                    });
                                }}
                            />
                        ) : (
                            <span style={{
                                color: 'black',
                                fontWeight: isVi ? '900' : 'bold',
                                fontSize: isVi ? '1.1rem' : (isCompact ? '0.75rem' : '0.9rem'),
                                letterSpacing: isVi ? '0.5px' : 'normal'
                            }}>
                                {link.platform}
                            </span>
                        )}

                        {typeLabel && (
                            <div style={{
                                position: 'absolute',
                                top: isCompact ? '3px' : '5px',
                                right: isCompact ? '-35px' : '-32px',
                                transform: 'rotate(45deg)',
                                width: '100px',
                                backgroundColor: ribbonColor,
                                color: 'black',
                                fontSize: isCompact ? '0.5rem' : '0.55rem',
                                fontWeight: '900',
                                textAlign: 'center',
                                padding: isCompact ? '1px 0' : '1px 0',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                textTransform: 'uppercase',
                                pointerEvents: 'none',
                                lineHeight: '1.2'
                            }}>
                                {typeLabel}
                            </div>
                        )}
                    </a>
                );
            })}
        </div>
    );

    return (
        <div style={{ marginBottom: '2rem', marginTop: '1.5rem' }}>
            {/* STREAMING SECTION */}
            {streamingLinks.length > 0 && (
                <div style={{ marginBottom: rentBuyLinks.length > 0 ? '2rem' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            margin: 0,
                            borderLeft: '4px solid var(--primary-color, #e50914)',
                            paddingLeft: '1rem'
                        }}>
                            Where to Watch
                        </h2>
                        {availableRegions.length > 0 && userRegion && !['US', 'IN', 'GB', 'CA', 'AU'].includes(userRegion) && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                padding: '4px 12px',
                                borderRadius: '50px',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>{getRegionLabel(selectedRegion).split(' ')[0]}</span>
                                <span style={{ fontSize: '0.85rem', color: '#ccc', fontWeight: 500 }}>
                                    {getRegionLabel(selectedRegion).split(' ').slice(1).join(' ')}
                                </span>
                            </div>
                        )}
                    </div>
                    {renderLinks(streamingLinks)}
                </div>
            )}

            {/* RENT/BUY SECTION */}
            {rentBuyLinks.length > 0 && (
                <div>
                    {/* Only show "Where to Watch" header here IF it wasn't shown above (e.g. no streaming links) */}
                    {streamingLinks.length === 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h2 style={{
                                fontSize: '1.8rem',
                                fontWeight: 'bold',
                                margin: 0,
                                borderLeft: '4px solid var(--primary-color, #e50914)',
                                paddingLeft: '1rem'
                            }}>
                                Where to Watch
                            </h2>
                            {availableRegions.length > 0 && userRegion && !['US', 'IN', 'GB', 'CA', 'AU'].includes(userRegion) && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    padding: '4px 12px',
                                    borderRadius: '50px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <span style={{ fontSize: '0.9rem' }}>{getRegionLabel(selectedRegion).split(' ')[0]}</span>
                                    <span style={{ fontSize: '0.85rem', color: '#ccc', fontWeight: 500 }}>
                                        {getRegionLabel(selectedRegion).split(' ').slice(1).join(' ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sub-header if Streaming exists, otherwise it's just the main content */}
                    {streamingLinks.length > 0 && (
                        <h3 style={{
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            marginTop: 0,
                            marginBottom: '1rem',
                            color: '#ccc',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Rent or Buy
                        </h3>
                    )}

                    {renderLinks(rentBuyLinks)}
                </div>
            )}
        </div>
    );
};

export default WatchOptions;
