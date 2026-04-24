"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Star, ChevronUp, ChevronDown, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { getMoviesByTag } from '../lib/api';

import MovieHero from './MovieHero';
import MovieCast from './MovieCast';
import MovieSeasons from './MovieSeasons';
import MovieVideos from './MovieVideos';
import WatchOptions from './WatchOptions';

import HorizontalScrollSection from './HorizontalScrollSection';
import PageSkeleton from './PageSkeleton';
import Footer from './Footer';

import type { Movie, Article } from '../types';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { getYoutubeId } from '../utils/videoUtils';
import { formatDuration, formatDate, formatVoteCount, formatLanguage, isValidContent } from '../utils/formatUtils';
import { convertCurrency } from '../utils/currencyUtils';

interface MoviePageClientProps {
    movie: Movie;
    recommendations: Movie[];
    articles: any[]; // Using any to avoid strict type issues with Supabase raw return, but ideally Article[]
    extraSections?: {
        title: string;
        data: Movie[];
        linkTo?: string;
    }[];
    children?: React.ReactNode;
    sidebarSlot?: React.ReactNode;
}

const MoviePageClient: React.FC<MoviePageClientProps> = ({ movie, recommendations, articles, extraSections = [], children, sidebarSlot }) => {
    const router = useRouter();
    const [playingTrailerUrl, setPlayingTrailerUrl] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [userRegion, setUserRegion] = useState<string | null>(null);

    // Gallery State
    const [isGalleryLoaded, setIsGalleryLoaded] = useState(false);
    const [showGalleryControls, setShowGalleryControls] = useState(false);
    const [galleryLimit, setGalleryLimit] = useState(20);
    const galleryScrollRef = useRef<HTMLDivElement>(null);

    // Why Watch Hover State
    const [hoveredWhyWatchIndex, setHoveredWhyWatchIndex] = useState<number | null>(null);

    // Debug: Log extraSections
    useEffect(() => {
        console.log('[MoviePageClient] extraSections:', extraSections);
        console.log('[MoviePageClient] extraSections count:', extraSections.length);
        console.log('[MoviePageClient] recommendations:', recommendations);
        console.log('[MoviePageClient] recommendations count:', recommendations.length);
    }, [extraSections, recommendations]);


    // Initial Region Detection (Effect)
    useEffect(() => {
        const detectRegion = async () => {
            // 1. Session Cache
            const cached = sessionStorage.getItem('userParams_country');
            if (cached) {
                setUserRegion(cached);
                return;
            }

            // 2. Timezone/Locale Heuristics
            let detected = null;
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz.includes('Calcutta') || tz.includes('Kolkata')) detected = 'IN';
            else if (tz.includes('London')) detected = 'GB';
            else if (tz.includes('Australia/')) detected = 'AU';

            if (!detected) {
                const lang = navigator.language;
                if (lang.includes('-US')) detected = 'US';
                else if (lang.includes('-IN')) detected = 'IN';
                else if (lang.includes('-GB')) detected = 'GB';
            }

            if (detected) {
                setUserRegion(detected);
                sessionStorage.setItem('userParams_country', detected);
            } else {
                // 3. Fallback IP API
                try {
                    const res = await fetch('https://ipapi.co/json/');
                    if (res.ok) {
                        const data = await res.json();
                        setUserRegion(data.country_code);
                        sessionStorage.setItem('userParams_country', data.country_code);
                    }
                } catch (e) {
                    console.warn('Region detect failed', e);
                    setUserRegion('US'); // Default
                }
            }
        };
        detectRegion();
    }, []);

    const handlePlayClick = (url: string) => {
        setPlayingTrailerUrl(url);
    };

    const closePlayer = () => {
        setPlayingTrailerUrl(null);
    };

    // Gallery Logic
    const openGallery = (index: number) => {
        setSelectedImageIndex(index);
    };

    const closeGallery = () => {
        setSelectedImageIndex(null);
    };

    // Body scroll lock effect
    useEffect(() => {
        if (selectedImageIndex !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedImageIndex]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedImageIndex === null || !movie.images) return;

            if (e.key === 'ArrowRight') {
                setSelectedImageIndex((prev) => (prev! + 1) % movie.images!.length);
            } else if (e.key === 'ArrowLeft') {
                setSelectedImageIndex((prev) => (prev! - 1 + movie.images!.length) % movie.images!.length);
            } else if (e.key === 'Escape') {
                closeGallery();
            }
        };

        if (selectedImageIndex !== null) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedImageIndex, movie.images]);

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedImageIndex !== null && movie.images) {
            setSelectedImageIndex((selectedImageIndex + 1) % movie.images.length);
        }
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedImageIndex !== null && movie.images) {
            setSelectedImageIndex((selectedImageIndex - 1 + movie.images.length) % movie.images.length);
        }
    };

    const scrollGallery = (direction: 'left' | 'right') => {
        if (galleryScrollRef.current) {
            const scrollAmount = 600;
            galleryScrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Derived state for gallery
    const images = movie.images || (movie.backdropUrl ? [movie.backdropUrl] : [movie.posterUrl]);

    // SEO: Schema.org Structured Data
    const schemaData = {
        "@context": "https://schema.org",
        "@type": movie.contentType === 'series' ? "TVSeries" : "Movie",
        "name": movie.title,
        "description": movie.description || movie.metaDescription,
        "image": movie.posterUrl,
        "datePublished": movie.releaseDate || movie.releaseYear,
        "aggregateRating": movie.rating > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": movie.rating,
            "bestRating": "10",
            "ratingCount": movie.voteCount || 100
        } : undefined,
        "director": movie.director ? {
            "@type": "Person",
            "name": movie.director
        } : undefined,
        "actor": movie.cast?.slice(0, 5).map(actor => ({
            "@type": "Person",
            "name": actor.name
        })),
        "genre": movie.tags,
        "url": `https://filmospere.com/movie/${(movie.slug || movie.id).replace(/\s+/g, '-')}`,
        "trailer": movie.trailerUrl ? {
            "@type": "VideoObject",
            "name": `${movie.title} Trailer`,
            "description": `Watch the official trailer for ${movie.title} on Filmospere`,
            "thumbnailUrl": movie.backdropUrl || movie.posterUrl,
            "uploadDate": movie.releaseDate || `${movie.releaseYear}-01-01`,
            "contentUrl": movie.trailerUrl,
            "embedUrl": movie.trailerUrl.includes('youtube') ? `https://www.youtube.com/embed/${getYoutubeId(movie.trailerUrl)}` : movie.trailerUrl
        } : undefined
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white', paddingBottom: '2rem' }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />
            <MovieHero movie={movie} onPlayClick={handlePlayClick} />

            <div className="container" style={{ marginTop: '0', position: 'relative', zIndex: 10, paddingTop: '0' }}>
                <div className="movie-content-wrapper">

                    {/* Unified Tags Section - Above Movie Info & Content */}
                    <div
                        className="tags-scroll-container"
                        style={{
                            display: 'flex',
                            flexWrap: 'nowrap',
                            overflowX: 'auto',
                            gap: '0.8rem',
                            marginBottom: '0', // Let the gap of wrapper handle spacing or add small
                            paddingBottom: '0.5rem',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch',
                            width: '100%',
                            flex: '0 0 100%', // Force full width in flex wrap
                            order: -2 // Ensure it appears above the sidebar (which is order -1 on mobile)
                        }}
                    >
                        <style jsx global>{`
                            .tags-scroll-container::-webkit-scrollbar {
                                display: none;
                            }
                            .movie-tag-pill {
                                background-color: rgba(255, 255, 255, 0.05);
                                border: 1px solid #333;
                                padding: 8px 20px;
                                border-radius: 50px;
                                font-size: 0.85rem;
                                line-height: 1;
                                color: #ccc;
                                text-decoration: none;
                                transition: all 0.2s;
                                cursor: pointer;
                                white-space: nowrap;
                                flex-shrink: 0;
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                min-height: auto !important;
                                height: auto !important;
                            }
                            .movie-tag-pill:hover {
                                border-color: white;
                                color: white;
                            }
                            .movie-tag-pill:active {
                                background-color: #e50914;
                                border-color: #e50914;
                                color: white;
                            }
                        `}</style>
                        {movie.tags?.map(tag => (
                            <Link
                                key={tag}
                                href={`/section/${encodeURIComponent(tag)}`}
                                className="movie-tag-pill"
                            >
                                {tag}
                            </Link>
                        ))}
                    </div>



                    {/* --- MAIN COLUMN --- */}
                    <div className="movie-main-col">

                        {/* Watch Options (Desktop Only) */}
                        <div className="hidden-on-mobile">
                            <WatchOptions
                                movie={movie}
                                selectedRegion={userRegion || 'US'}
                                userRegion={userRegion}
                            />
                        </div>

                        {/* Videos */}
                        <MovieVideos
                            videos={movie.videos || []}
                            trailerUrl={movie.trailerUrl}
                            posterUrl={movie.backdropUrl || movie.posterUrl}
                            onPlayClick={handlePlayClick}
                        />

                        {/* Cast */}
                        <MovieCast cast={movie.cast || []} />

                        {/* Seasons (if series) */}
                        {(movie.contentType === 'series' || (movie.seasons && movie.seasons.length > 0)) && (
                            <MovieSeasons seasons={movie.seasons || []} />
                        )}

                        {/* Why Watch This */}
                        {movie.whyWatch && movie.whyWatch.length > 0 && (
                            <div style={{ marginTop: '3rem' }}>
                                <h3 className="why-watch-title" style={{ marginBottom: '1.5rem' }}>Why Watch This?</h3>
                                <div className="why-watch-grid">
                                    {movie.whyWatch.map((point, index) => {
                                        // 1. Icon & Text Extraction Logic
                                        let icon = '✨';
                                        let text = point;

                                        // Check if the point *starts* with an emoji
                                        const parts = point.split(' ');
                                        const firstPart = parts[0];
                                        const isEmoji = /\p{Emoji}/u.test(firstPart) && firstPart.length < 5;

                                        if (isEmoji) {
                                            icon = firstPart;
                                            // Remove the emoji and valid separators from the start
                                            text = point.substring(firstPart.length).trim().replace(/^[:\-\s]+/, '');
                                        } else {
                                            // Fallback: Keyword-based icon assignment
                                            const lowerPoint = point.toLowerCase();
                                            if (lowerPoint.includes('act') || lowerPoint.includes('perform') || lowerPoint.includes('cast') || lowerPoint.includes('professor')) icon = '🎭';
                                            else if (lowerPoint.includes('direct') || lowerPoint.includes('pina') || lowerPoint.includes('vision') || lowerPoint.includes('filmmak')) icon = '🎬';
                                            else if (lowerPoint.includes('visual') || lowerPoint.includes('cinematography') || lowerPoint.includes('look') || lowerPoint.includes('effect')) icon = '🎨';
                                            else if (lowerPoint.includes('writ') || lowerPoint.includes('plot') || lowerPoint.includes('story') || lowerPoint.includes('script') || lowerPoint.includes('dialogue')) icon = '✍️';
                                            else if (lowerPoint.includes('thrill') || lowerPoint.includes('suspense') || lowerPoint.includes('action') || lowerPoint.includes('heist')) icon = '🔥';
                                            else if (lowerPoint.includes('emotion') || lowerPoint.includes('heart') || lowerPoint.includes('love') || lowerPoint.includes('tear')) icon = '❤️';
                                            else if (lowerPoint.includes('humor') || lowerPoint.includes('fun') || lowerPoint.includes('laugh') || lowerPoint.includes('comedy')) icon = '😂';
                                            else if (lowerPoint.includes('music') || lowerPoint.includes('score') || lowerPoint.includes('sound') || lowerPoint.includes('song')) icon = '🎵';
                                        }

                                        return (
                                            <div
                                                key={index}
                                                onMouseEnter={() => setHoveredWhyWatchIndex(index)}
                                                onMouseLeave={() => setHoveredWhyWatchIndex(null)}
                                                style={{
                                                    backgroundColor: hoveredWhyWatchIndex === index ? 'rgba(255, 255, 255, 0.1)' : '#1f1f1f',
                                                    borderRadius: '12px',
                                                    padding: '1.5rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '1rem',
                                                    transition: 'all 0.3s ease',
                                                    border: hoveredWhyWatchIndex === index ? '1px solid rgba(255,255,255,0.4)' : '1px solid #333',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    transform: hoveredWhyWatchIndex === index ? 'translateY(-5px)' : 'none',
                                                    boxShadow: hoveredWhyWatchIndex === index ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
                                                    cursor: 'default',
                                                    zIndex: hoveredWhyWatchIndex === index ? 20 : 1
                                                }}
                                            >
                                                <div style={{
                                                    fontSize: '2.5rem',
                                                    lineHeight: 1,
                                                    transform: hoveredWhyWatchIndex === index ? 'scale(1.1)' : 'scale(1)',
                                                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                                }}>{icon}</div>
                                                <div style={{ color: '#ccc', fontSize: '1rem', lineHeight: '1.5' }}>{text}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* --- SIDEBAR --- */}
                    <div className="movie-sidebar">
                        <h3 className="sidebar-section-title">Movie Info</h3>

                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    {/* Logic: Show Creator if Director is missing, otherwise show Director */}
                                    {(() => {
                                        const hasDirector = movie.director && !['unknown', 'n/a'].includes(movie.director.toLowerCase());
                                        const showCreator = !hasDirector && movie.creator;

                                        if (showCreator) {
                                            return (
                                                <>
                                                    <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Creator</div>
                                                    <div style={{ fontWeight: 500 }}>{movie.creator}</div>
                                                </>
                                            );
                                        } else {
                                            return (
                                                <>
                                                    <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Director</div>
                                                    <div style={{ fontWeight: 500 }}>
                                                        {!hasDirector ? (
                                                            <span>{movie.director || 'Unknown'}</span>
                                                        ) : (
                                                            <Link
                                                                href={`/person/director-${encodeURIComponent(movie.director || '')}`}
                                                                style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                                                                onMouseEnter={e => e.currentTarget.style.color = '#e50914'}
                                                                onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
                                                            >
                                                                {movie.director}
                                                            </Link>
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        }
                                    })()}
                                </div>

                                {(movie.languages || movie.language) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Language</div>
                                        <div style={{ fontWeight: 500 }}>
                                            {(() => {
                                                const INDUSTRY_MAP: Record<string, string> = {
                                                    'hindi': 'Bollywood',
                                                    'english': 'Hollywood',
                                                    'telugu': 'Tollywood',
                                                    'tamil': 'Kollywood',
                                                    'malayalam': 'Mollywood',
                                                    'kannada': 'Sandalwood',
                                                    'punjabi': 'Pollywood',
                                                    'bengali': 'Bengali Cinema',
                                                    'marathi': 'Marathi Cinema',
                                                    'korean': 'K-Drama',
                                                    'chinese': 'Chinese Cinema',
                                                    'japanese': 'Anime'
                                                };

                                                const primary = movie.language ? movie.language.toLowerCase() : null;
                                                let allLangs: string[] = [];

                                                if (movie.languages) {
                                                    allLangs = [...movie.languages];
                                                } else if (movie.language) {
                                                    allLangs = [movie.language];
                                                }

                                                // Normalize & Deduplicate
                                                allLangs = Array.from(new Set(allLangs.map(l => l.toLowerCase())));

                                                // Sort: Primary first
                                                if (primary) {
                                                    allLangs.sort((a, b) => {
                                                        if (a === primary) return -1;
                                                        if (b === primary) return 1;
                                                        return 0;
                                                    });
                                                }

                                                return allLangs.map((l, index) => {
                                                    const formatted = formatLanguage(l);
                                                    const industry = INDUSTRY_MAP[l] || INDUSTRY_MAP[formatted.toLowerCase()];
                                                    const isLast = index === allLangs.length - 1;

                                                    if (industry) {
                                                        return (
                                                            <span key={l}>
                                                                <Link
                                                                    href={`/section/${encodeURIComponent(industry)}`}
                                                                    style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                                                                >
                                                                    {formatted}
                                                                </Link>
                                                                {!isLast && ', '}
                                                            </span>
                                                        );
                                                    }
                                                    return <span key={l}>{formatted}{!isLast && ', '}</span>;
                                                });
                                            })()}

                                        </div>
                                    </div>
                                )}

                                {movie.status && movie.status !== 'Released' && movie.status !== 'Ended' && movie.status !== 'Returning Series' && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Status</div>
                                        <div style={{
                                            fontWeight: 500,
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: 'rgba(255, 165, 0, 0.2)',
                                            color: '#ffa500',
                                            fontSize: '0.9rem'
                                        }}>
                                            {movie.status}
                                        </div>
                                    </div>
                                )}



                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Release Date</div>
                                    <div style={{ fontWeight: 500 }}>{formatDate(movie.releaseDate) || movie.releaseYear}</div>
                                </div>

                                {movie.budget && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Budget</div>
                                        <div style={{ fontWeight: 500 }}>
                                            {convertCurrency(movie.budget, movie.releaseYear, movie.language) || movie.budget}
                                        </div>
                                    </div>
                                )}

                                {movie.boxOffice && movie.boxOffice !== 'N/A' && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Box Office</div>
                                        <div style={{ fontWeight: 500 }}>
                                            {convertCurrency(movie.boxOffice, movie.releaseYear, movie.language) || movie.boxOffice}
                                        </div>
                                    </div>
                                )}

                                <div className="hidden-on-mobile">
                                    <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Duration</div>
                                    <div style={{ fontWeight: 500 }}>
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
                                    </div>
                                </div>
                            </div>

                            {/* Small Poster in Sidebar */}
                            <div style={{ width: '120px', flexShrink: 0, position: 'relative', aspectRatio: '2/3' }}>
                                <Image
                                    src={movie.posterUrl}
                                    alt={`${movie.title} Poster`}
                                    fill
                                    sizes="120px"
                                    style={{
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e: React.MouseEvent<HTMLImageElement>) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e: React.MouseEvent<HTMLImageElement>) => e.currentTarget.style.transform = 'scale(1)'}
                                    unoptimized={true}
                                />
                            </div>
                        </div>

                        {/* Ratings Section - Hidden if 0 */}
                        {movie.rating > 0 && (
                            <div style={{ marginTop: '3rem' }} className="hidden-on-mobile">
                                <h3 className="sidebar-section-title">Rating</h3>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Filmospere Score</div>
                                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                        <Star fill="#e5b109" color="#e5b109" size={20} />
                                        <span>{movie.rating.toFixed(1)}/10</span>
                                        {movie.voteCount > 0 && (
                                            <span style={{ fontSize: '0.9rem', color: '#666' }}>({formatVoteCount(movie.voteCount)} votes)</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- MOBILE WATCH OPTIONS (Below Info, Above Storyline) --- */}
                        <div className="mobile-only" style={{ marginTop: '2rem', marginBottom: '1rem', width: '100%' }}>
                            <WatchOptions
                                movie={movie}
                                selectedRegion={userRegion || 'US'}
                                userRegion={userRegion}
                            />
                        </div>

                        {/* Storyline Section (Mobile Only - Hidden on Desktop) */}
                        {movie.description && (
                            <div className="mobile-only" style={{ marginTop: '3rem', width: '100%' }}>
                                <h3 className="why-watch-title" style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Storyline</h3>
                                <p style={{
                                    fontSize: '1.1rem',
                                    lineHeight: '1.8',
                                    color: '#d1d1d1',
                                    fontFamily: 'Georgia, serif', // Article font
                                    textAlign: 'justify',
                                    width: '100%',
                                    maxWidth: '100%'
                                }}>
                                    {movie.description}
                                </p>
                            </div>
                        )}

                        {sidebarSlot}
                    </div>
                </div>


                {/* --- BOTTOM SECTIONS (Streaming Slot) --- */}
                <div className="movie-bottom-sections" style={{ marginTop: '2rem' }}>

                    {/* Render Children (Server Component Stream) if provided */}
                    {children ? (
                        children
                    ) : (
                        // FALLBACK for legacy or direct usage
                        <>
                            <div style={{ marginTop: (movie.whyWatch && movie.whyWatch.length > 0) ? '2rem' : '0', marginBottom: '1.5rem' }}>
                                {recommendations.length > 0 && (
                                    <HorizontalScrollSection title="You May Also Like" data={recommendations} linkTo="#" />
                                )}
                            </div>

                            {/* Dynamic Extra Sections (Genre, Cast, Industry) */}
                            {extraSections.map((section, index) => (
                                <div key={index} style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                                    <HorizontalScrollSection
                                        title={section.title}
                                        data={section.data}
                                        linkTo={section.linkTo}
                                    />
                                </div>
                            ))}
                        </>
                    )}


                    {/* Gallery Section */}
                    {movie.images && movie.images.length > 0 && (
                        <div style={{ marginTop: '4rem', marginBottom: '2rem' }}>
                            <div
                                className="gallery-header-container"
                                onClick={() => setIsGalleryLoaded(!isGalleryLoaded)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    marginBottom: isGalleryLoaded ? '1.5rem' : '0',
                                    userSelect: 'none'
                                }}
                            >
                                <h2 className="actor-filmography-title" style={{
                                    fontWeight: 'bold',
                                    borderLeft: '4px solid #e50914',
                                    paddingLeft: '1rem',
                                    fontSize: '1.5rem',
                                    margin: 0,
                                    marginRight: '1rem'
                                }}>
                                    Gallery
                                </h2>
                                <div
                                    className="gallery-header-group"
                                    onClick={() => setIsGalleryLoaded(prev => !prev)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: '#888',
                                        fontSize: '1rem',
                                        transition: 'color 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#888'}
                                >
                                    <span className="gallery-toggle-icon" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isGalleryLoaded ? 'var(--primary-color)' : 'white'
                                    }}>
                                        <ChevronDown size={28} style={{
                                            transform: isGalleryLoaded ? 'rotate(180deg)' : 'rotate(-90deg)',
                                            transition: 'transform 0.3s ease'
                                        }} />
                                    </span>
                                </div>
                            </div>

                            {/* Gallery Grid - Vertical & Premium */}
                            {isGalleryLoaded && (
                                <div className="gallery-wrapper" style={{ marginTop: '1.5rem' }}>
                                    <div
                                        className="gallery-grid"
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                            gap: '1rem',
                                            width: '100%'
                                        }}
                                    >
                                        {movie.images.slice(0, galleryLimit).map((img, index) => (
                                            <div key={index}
                                                onClick={() => openGallery(index)}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '16/9',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                                    backgroundColor: '#222',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
                                                }}
                                            >
                                                <Image
                                                    src={getOptimizedImageUrl(img, 600)}
                                                    alt={`${movie.title} scene`}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 300px"
                                                    style={{
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.5s ease'
                                                    }}
                                                    className="gallery-image"
                                                    unoptimized={true}
                                                />
                                            </div>
                                        ))}

                                        {/* Load More Card (Grid Item) */}
                                        {movie.images.length > galleryLimit && (
                                            <div
                                                onClick={() => setGalleryLimit(prev => prev + 20)}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '16/9',
                                                    borderRadius: '12px',
                                                    border: '2px dashed #444',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'transparent',
                                                    transition: 'all 0.2s ease',
                                                    color: '#888'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                                    e.currentTarget.style.borderColor = '#888';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.borderColor = '#444';
                                                    e.currentTarget.style.color = '#888';
                                                }}
                                            >
                                                <span style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>+</span>
                                                <span style={{ fontSize: '1rem', fontWeight: '500' }}>Load More</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Video Player Overlay */}
            {playingTrailerUrl && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'black', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <button
                        onClick={closePlayer}
                        style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 1001 }}
                    >
                        <X size={32} />
                    </button>
                    <div style={{ width: '100%', height: '100%', maxWidth: '1200px', maxHeight: '80vh' }}>
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${getYoutubeId(playingTrailerUrl)}?autoplay=1`}
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title="Trailer"
                        />
                    </div>
                </div>
            )}

            {/* Lightbox Gallery Overlay */}
            {selectedImageIndex !== null && (
                <div
                    className="lightbox-container"
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onClick={closeGallery}
                >
                    <button
                        onClick={closeGallery}
                        style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 3001 }}
                    >
                        <X size={32} />
                    </button>

                    <button className="lightbox-nav-button" onClick={prevImage} style={{ position: 'absolute', left: '20px', color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '1rem', borderRadius: '50%', zIndex: 3001 }}>
                        <ArrowLeft size={24} />
                    </button>

                    <div style={{ position: 'relative', width: '90vw', height: '90vh' }}>
                        <Image
                            src={getOptimizedImageUrl(images[selectedImageIndex], 1920)}
                            alt="Gallery"
                            fill
                            style={{ objectFit: 'contain' }}
                            sizes="90vw"
                            priority
                            unoptimized={!!images[selectedImageIndex].includes('wsrv.nl')}
                        />
                    </div>

                    <button className="lightbox-nav-button" onClick={nextImage} style={{ position: 'absolute', right: '20px', color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '1rem', borderRadius: '50%', transform: 'rotate(180deg)', zIndex: 3001 }}>
                        <ArrowLeft size={24} />
                    </button>
                </div>
            )}


        </div>
    );
};

export default MoviePageClient;
