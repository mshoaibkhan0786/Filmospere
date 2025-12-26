import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, X, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../components/Navbar';

import MovieHero from '../components/MovieHero';
import MovieCast from '../components/MovieCast';
import MovieSeasons from '../components/MovieSeasons';
import MovieVideos from '../components/MovieVideos';
import MovieRecommendations from '../components/MovieRecommendations';
import HorizontalScrollSection from '../components/HorizontalScrollSection';
import Footer from '../components/Footer';
import PageSkeleton from '../components/PageSkeleton';
import WatchOptions from '../components/WatchOptions';
import { useMovies } from '../context/MovieContext';
import { formatDuration, formatVoteCount, isValidContent, formatDate, formatLanguage } from '../utils/formatUtils';
import { convertCurrency } from '../utils/currencyUtils';
import { getYoutubeId } from '../utils/videoUtils';

// Platform logos/colors fallback if needed, or import from constants if available.
// For now, simpler inline rendering or reuse logic if possible.
// Replicating simple streaming link logic from MovieDetails to avoid circular dependencies or strict coupling.

// import { supabase } from '../lib/supabase'; // Direct import removed
import { ArticleService } from '../services/ArticleService';
import type { Article } from '../types';

const RelatedArticlesSection: React.FC<{ movieId: string; movieTitle: string }> = ({ movieId, movieTitle }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            console.log(`[RelatedArticles] Effect triggered. ID: ${movieId}, Title: ${movieTitle}`);
            if (!movieId) {
                console.log("[RelatedArticles] No movieId, skipping.");
                setIsLoading(false);
                return;
            }

            try {
                const results = await ArticleService.getArticlesByMovieId(movieId, movieTitle);
                console.log(`[RelatedArticles] Results:`, results);
                setArticles(results);
            } catch (err: any) {
                console.error("[RelatedArticles] Article fetch failed:", err);
                setArticles([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchArticles();
    }, [movieId, movieTitle]);

    if (isLoading || articles.length === 0) return null;

    return (
        <div style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                .read-article-text:hover {
                    color: white !important;
                }
            `}</style>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Related Articles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {articles.map(article => (
                    <Link
                        key={article.id}
                        to={`/articles/${article.slug}`}
                        className="related-article-link"
                        style={{ textDecoration: 'none', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                    >
                        {article.image_url && (
                            <div style={{ overflow: 'hidden', borderRadius: '4px', width: '60px', height: '60px', flexShrink: 0 }}>
                                <img
                                    src={article.image_url}
                                    alt={article.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        )}
                        <div>
                            <h4 style={{
                                fontSize: '0.9rem',
                                margin: '0 0 4px 0',
                                lineHeight: '1.3',
                                color: '#e5e5e5',
                                transition: 'color 0.2s'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#e50914'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#e5e5e5'}
                            >
                                {article.title}
                            </h4>
                            <span className="read-article-text" style={{ fontSize: '0.75rem', color: '#888', transition: 'color 0.2s' }}>Read Article &rarr;</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const MoviePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getMovie, fetchMovieById, movies, isLoading: contextLoading, addToHistory, fetchRelatedMovies } = useMovies();
    const [movie, setMovie] = useState(getMovie(id || ''));

    // Auto-Refresh for Stale Data (specifically for experimental features)
    useEffect(() => {
        if (movie) {
            // If Money Heist is loaded but missing the new "whyWatch" data, force a re-fetch
            if ((movie.id?.includes('71446') || movie.title === 'Money Heist') && (!movie.whyWatch || movie.whyWatch.length === 0)) {
                // Detecting stale data, fetching fresh
                fetchMovieById(movie.id, true).then(fresh => {
                    if (fresh) setMovie(fresh);
                });
            }
        }
    }, [movie, fetchMovieById]);
    // Initialize loading state based on whether we found the movie in cache
    const [isFetching, setIsFetching] = useState(() => !getMovie(id || ''));
    const [fetchError, setFetchError] = useState(false); // New: prevent infinite loops
    const [playingTrailerId, setPlayingTrailerId] = useState<string | null>(null);

    // Gallery State
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [galleryLimit, setGalleryLimit] = useState(10);
    const galleryScrollRef = React.useRef<HTMLDivElement>(null);
    const [showGalleryControls, setShowGalleryControls] = useState(false);
    const [isGalleryLoaded, setIsGalleryLoaded] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState('US'); // Default Region
    const [userRegion, setUserRegion] = useState<string | null>(null);
    const [hoveredWhyWatchIndex, setHoveredWhyWatchIndex] = useState<number | null>(null);

    const openGallery = (index: number) => {
        setSelectedImageIndex(index);
        document.body.style.overflow = 'hidden';
    };

    // Fetch User Location (Smart Detect)
    useEffect(() => {
        const fetchLocation = async () => {
            try {
                // 1. Check Session Cache
                const cached = sessionStorage.getItem('userParams_country');
                if (cached) {
                    setUserRegion(cached);
                    return;
                }

                // 2. Client-Side Heuristics (Instant & Block-proof)
                let detectedRegion = null;

                // Timezone Check (High Confidence)
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (tz.includes('Calcutta') || tz.includes('Kolkata')) detectedRegion = 'IN';
                else if (tz.includes('London') || tz === 'Europe/Belfast') detectedRegion = 'GB';
                else if (tz.includes('Australia/')) detectedRegion = 'AU';

                // Locale Check (Secondary Hint)
                if (!detectedRegion) {
                    const lang = navigator.language || (navigator.languages && navigator.languages[0]);
                    if (lang) {
                        const parts = lang.split('-');
                        if (parts.length > 1) {
                            const region = parts[1].toUpperCase();
                            // Only trust major supported regions from locale to avoid bad mismatches
                            if (['US', 'GB', 'IN', 'AU', 'CA'].includes(region)) {
                                detectedRegion = region;
                            }
                        }
                    }
                }

                if (detectedRegion) {
                    setUserRegion(detectedRegion);
                    sessionStorage.setItem('userParams_country', detectedRegion);
                    // Return early to skip fetch if satisfied, or logic to verify can go here
                    return;
                }

                // 3. Fallback to IP API (Slower, might be blocked)
                const response = await fetch('https://ipapi.co/json/');
                if (response.ok) {
                    const data = await response.json();
                    if (data.country_code) {
                        setUserRegion(data.country_code);
                        sessionStorage.setItem('userParams_country', data.country_code);
                    }
                }
            } catch (error) {
                console.warn('Location detection failed, defaulting to US', error);
            }
        };

        fetchLocation();
    }, []);

    // Auto-select region if available
    useEffect(() => {
        if (userRegion && movie?.streamingLinks) {
            const hasRegion = movie.streamingLinks.some(l => l.country === userRegion);
            if (hasRegion) {
                setSelectedRegion(userRegion);
            }
        }
    }, [userRegion, movie]);

    const closeGallery = () => {
        setSelectedImageIndex(null);
        document.body.style.overflow = 'unset';
    };

    const nextImage = (e?: React.MouseEvent | KeyboardEvent) => {
        if (e && 'stopPropagation' in e) {
            e.stopPropagation();
            if ('preventDefault' in e) e.preventDefault();
        }
        if (selectedImageIndex !== null && movie?.images) {
            setSelectedImageIndex((prev) => (prev! + 1) % movie.images!.length);
        }
    };

    const prevImage = (e?: React.MouseEvent | KeyboardEvent) => {
        if (e && 'stopPropagation' in e) {
            e.stopPropagation();
            if ('preventDefault' in e) e.preventDefault();
        }
        if (selectedImageIndex !== null && movie?.images) {
            setSelectedImageIndex((prev) => (prev! - 1 + movie.images!.length) % movie.images!.length);
        }
    };

    const scrollGallery = (direction: 'left' | 'right') => {
        if (galleryScrollRef.current) {
            const { current } = galleryScrollRef;
            const scrollAmount = direction === 'left' ? -500 : 500;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // 4. MAIN DATA LOADING LOGIC (Fixed for Infinite Loops)

    // Step A: Sync Check (Context)
    useEffect(() => {
        if (!id) return;
        setFetchError(false); // Reset error on ID change

        const foundMovie = movies.find(m => m.id === id || m.slug === id);

        // Helper to check if movie has full details (not just cached partial)
        const isDetailed = foundMovie &&
            foundMovie.director && foundMovie.director !== 'Unknown' &&
            foundMovie.description && foundMovie.description.length > 0 &&
            (foundMovie.cast && foundMovie.cast.length > 0);

        if (foundMovie) {
            setMovie(foundMovie);

            if (isDetailed) {
                // If we have the FULL movie, we are done.
                fetchRelatedMovies(foundMovie);
                setIsFetching(false);
            } else {
                // If we only have partial data (from Home Cache), we show it BUT keep fetching.
                console.log(`[MoviePage] Found partial data for ${foundMovie.title}, upgrading...`);
                setIsFetching(true);
            }
        } else {
            // Not in context? We need to fetch.
            // But if we already have the CORRECT movie in state (from previous fetch), keep it.
            if (movie && (movie.id === id || movie.slug === id) &&
                movie.director && movie.director !== 'Unknown') {
                // Already have it in local state and it's detailed
                setIsFetching(false);
            } else {
                // Don't have it -> Loading
                setIsFetching(true);
                setMovie(undefined); // Clear old movie (undefined matches inferred type)
            }
        }
    }, [id, movies, fetchRelatedMovies]);

    // Step B: Async Fetch (API)
    useEffect(() => {
        // Only fetch if:
        // 1. We are explicitly "fetching" (setIsFetching(true) was called)
        // 2. We haven't already failed for this ID (fetchError check)
        // Note: We removed the `!movie` check to allow "upgrading" partial movies.
        if (isFetching && id && !fetchError) {
            let isActive = true; // Prevent race conditions

            fetchMovieById(id).then(m => {
                if (!isActive) return;

                if (m) {
                    setMovie(m);
                    fetchRelatedMovies(m);
                    setIsFetching(false);
                } else {
                    // Failed to find movie
                    console.warn(`Movie not found for ID: ${id}`);
                    setFetchError(true); // STOP fetching for this ID
                    setIsFetching(false); // Stop loading state (will show 404/Empty)
                }
            }).catch(() => {
                if (!isActive) return;
                setFetchError(true);
                setIsFetching(false);
            });

            return () => { isActive = false; };
        }
    }, [id, isFetching, fetchError, fetchMovieById, fetchRelatedMovies]);

    // Auto-Refresh for Stale Data (specifically for experimental features)
    useEffect(() => {
        if (movie) {
            // If Money Heist is loaded but missing the new "whyWatch" data, force a re-fetch
            if ((movie.id?.includes('71446') || movie.title === 'Money Heist') && (!movie.whyWatch || movie.whyWatch.length === 0)) {
                // Detecting stale data, fetching fresh
                fetchMovieById(movie.id, true).then(fresh => {
                    if (fresh) setMovie(fresh);
                });
            }
        }
    }, [movie, fetchMovieById]);

    // Update history when movie is loaded/viewed
    useEffect(() => {
        if (movie) addToHistory(movie);
    }, [movie?.id]); // Only run when ID changes/loaded

    // Combine loading states
    const isLoading = contextLoading || isFetching;

    useEffect(() => {
        console.log(`[MoviePage Debug] id=${id}, movie=${!!movie}, isFetching=${isFetching}, contextLoading=${contextLoading}, fetchError=${fetchError}, FINAL_LOADING=${isLoading}`);
    }, [id, movie, isFetching, contextLoading, fetchError, isLoading]);

    // Scroll to top on id change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // Keyboard navigation for gallery
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedImageIndex === null) return;

            if (e.key === 'Escape') closeGallery();
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextImage(e);
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevImage(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIndex, movie?.images]);

    // Check if scrolling is needed
    useEffect(() => {
        const checkScroll = () => {
            if (galleryScrollRef.current) {
                const { scrollWidth, clientWidth } = galleryScrollRef.current;
                setShowGalleryControls(scrollWidth > clientWidth);
            }
        };

        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [movie?.images, galleryLimit, isGalleryLoaded]);

    useEffect(() => {
        if (movie) {
            addToHistory(movie);
        }
    }, [movie, addToHistory]); // Depend on movie and addToHistory

    // Fix: Moved Hook to Top Level (before early returns)
    // Calculate metaDesc safely (defaults to generic if movie is null)
    const safeMetaDesc = movie?.metaDescription || movie?.description || (movie ? `Watch ${movie.title} on Filmospere.` : 'Filmospere');

    // Manual Meta Tag Injection as Fallback for React 19 / Viewer Issues
    useEffect(() => {
        if (!safeMetaDesc) return;

        let metaTag = document.querySelector('meta[name="description"]');
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'description');
            document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', safeMetaDesc);

        // Cleanup on unmount (optional, or revert to default)
        return () => {
            // Optional: metaTag.setAttribute('content', ''); 
        };
    }, [safeMetaDesc]);

    // Helper to detect if the *current* movie object is just a partial placeholder
    const isIncomplete = movie && (
        !movie.director || movie.director === 'Unknown' ||
        !movie.description || movie.description.length === 0 ||
        (!movie.images || movie.images.length === 0)
    );

    // Show Skeleton if:
    // 1. We are loading AND have no movie
    // 2. We are loading (upgrading) AND the current movie is incomplete (would look broken)
    if ((isLoading && !movie) || (isLoading && isIncomplete)) {
        return <PageSkeleton />;
    }



    if (!movie) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#141414' }}>
                <Navbar onSearch={(q) => navigate('/?search=' + q)} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexDirection: 'column', gap: '1rem' }}>
                    <h1>Movie not found</h1>
                    <button onClick={() => navigate('/')} style={{ padding: '0.8rem 1.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Go Home</button>
                </div>
            </div>
        );
    }

    const handlePlayClick = (url: string) => {
        if (!url) return;

        // Check for YouTube
        const ytId = getYoutubeId(url);
        if (ytId) {
            setPlayingTrailerId(ytId);
            return;
        }

        // Default to internal player logic
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            // Fallback if getYoutubeId failed but it looks like youtube
            window.open(url, '_blank');
        } else {
            navigate(`/watch/${movie.id}`);
        }
    };



    const metaTitle = movie.metaTitle || `${movie.title} (${movie.releaseYear}) | Filmospere`;
    const metaDesc = movie.metaDescription || movie.description || `Watch ${movie.title} on Filmospere.`;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white' }}>
            <Helmet>
                <title>{metaTitle}</title>
                <meta name="description" content={metaDesc} key="description" />
                {movie.keywords && <meta name="keywords" content={movie.keywords} />}
                <link rel="canonical" href={window.location.href} />

                {/* Open Graph / Social Media */}
                <meta property="og:title" content={metaTitle} />
                <meta property="og:description" content={metaDesc} />
                <meta property="og:image" content={`https://image.tmdb.org/t/p/w780${movie.posterUrl}`} />
                <meta property="og:type" content="video.movie" />
                <meta property="og:url" content={window.location.href} />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={metaTitle} />
                <meta name="twitter:description" content={metaDesc} />
                <meta name="twitter:image" content={`https://image.tmdb.org/t/p/w780${movie.posterUrl}`} />
            </Helmet>
            <Navbar onSearch={(q) => navigate('/?search=' + q)} showBackArrow={true} />

            {/* Hero Section */}
            <MovieHero movie={movie} onPlayClick={handlePlayClick} />

            {/* Main Content Sections */}
            <div className="container" style={{ position: 'relative', zIndex: 10, paddingBottom: '4rem', marginTop: '2rem' }}>

                {/* Two Column Layout */}
                <div>
                    <div className="movie-content-wrapper">

                        {/* Left Column: Main Content */}
                        {/* Mobile Only: Genres (Tags) - Moves to top via Order -2 */}
                        <div className="mobile-tags-section">
                            {movie.tags?.map(tag => (
                                <Link
                                    key={tag}
                                    to={`/section/${encodeURIComponent(tag)}`}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid #333',
                                        padding: '0 20px',
                                        borderRadius: '50px',
                                        fontSize: '14px',
                                        color: '#ccc',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                        height: '36px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'white';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.borderColor = '#333';
                                        e.currentTarget.style.color = '#ccc';
                                    }}
                                    onMouseDown={e => {
                                        e.currentTarget.style.backgroundColor = '#e50914';
                                        e.currentTarget.style.borderColor = '#e50914';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                >
                                    {tag}
                                </Link>
                            ))}
                        </div>

                        {/* Left Column: Main Content */}
                        <div className="movie-main-col">

                            {/* Genres (Desktop Only) */}
                            <div className="desktop-only" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                {movie.tags?.map(tag => (
                                    <Link
                                        key={tag}
                                        to={`/section/${encodeURIComponent(tag)}`}
                                        style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid #333',
                                            padding: '0 20px',
                                            borderRadius: '50px',
                                            fontSize: '14px',
                                            color: '#ccc',
                                            textDecoration: 'none',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '36px'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'white';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.borderColor = '#333';
                                            e.currentTarget.style.color = '#ccc';
                                        }}
                                        onMouseDown={e => {
                                            e.currentTarget.style.backgroundColor = '#e50914';
                                            e.currentTarget.style.borderColor = '#e50914';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                    >
                                        {tag}
                                    </Link>
                                ))}
                            </div>

                            {/* Watch on Section */}
                            <WatchOptions
                                movie={movie}
                                selectedRegion={selectedRegion}
                                userRegion={userRegion}
                            />



                            {/* Videos */}
                            <div style={{ width: '100%' }}>
                                <MovieVideos
                                    videos={movie.videos || []}
                                    trailerUrl={movie.trailerUrl}
                                    posterUrl={movie.posterUrl}
                                    onPlayClick={handlePlayClick}
                                />
                            </div>

                            {/* Top Cast */}
                            <div style={{ width: '100%' }}>
                                <MovieCast cast={movie.cast} />
                            </div>

                            {/* Why Watch This */}
                            {movie.whyWatch && Array.isArray(movie.whyWatch) && movie.whyWatch.length > 0 && (
                                <div style={{ width: '100%', marginTop: '3rem', marginBottom: '1rem' }}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h2 className="why-watch-title">
                                            Why Watch This
                                        </h2>
                                    </div>
                                    {/* Why Watch This - Card Layout */}
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
                                                        position: 'relative',
                                                        background: hoveredWhyWatchIndex === index ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                        backdropFilter: 'blur(10px)',
                                                        border: `1px solid ${hoveredWhyWatchIndex === index ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                                                        borderRadius: '16px',
                                                        padding: '1.5rem',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '1rem',
                                                        boxShadow: hoveredWhyWatchIndex === index ? '0 12px 40px 0 rgba(0, 0, 0, 0.45)' : '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                                                        animation: `slideUpFadeIn 0.6s ease-out forwards`,
                                                        animationDelay: `${index * 0.1}s`, // Changed to 0.1s for faster stagger
                                                        transform: hoveredWhyWatchIndex === index ? 'translateY(-5px)' : 'none',
                                                        transition: 'all 0.3s ease',
                                                        opacity: 0, // Initial state, animation fills it to 1
                                                        cursor: 'default'
                                                    }}
                                                >
                                                    <div style={{
                                                        fontSize: '2.5rem',
                                                        lineHeight: 1,
                                                        transform: hoveredWhyWatchIndex === index ? 'scale(1.1)' : 'scale(1)',
                                                        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                                    }}>{icon}</div>
                                                    <p style={{
                                                        fontSize: '1rem',
                                                        lineHeight: '1.6',
                                                        color: 'rgba(255, 255, 255, 0.9)',
                                                        margin: 0
                                                    }}>
                                                        {text}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}



                            {/* Seasons (for Series) - Moved after Cast */}
                            {movie.contentType === 'series' && movie.seasons && (
                                <MovieSeasons seasons={movie.seasons} />
                            )}

                        </div>

                        {/* Right Column: Movie Info Sidebar */}
                        <div className="movie-sidebar" style={{ width: '300px', flexShrink: 0 }}>
                            <h3 className="sidebar-section-title">Movie Info</h3>

                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Director</div>
                                        <div style={{ fontWeight: 500 }}>
                                            {['unknown', 'n/a'].includes((movie.director || '').toLowerCase()) ? (
                                                <span>{movie.director || 'Unknown'}</span>
                                            ) : (
                                                <Link
                                                    to={`/person/director-${encodeURIComponent(movie.director || '')}`}
                                                    style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#e50914'}
                                                    onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
                                                >
                                                    {movie.director}
                                                </Link>
                                            )}
                                        </div>
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

                                                    // Normalize
                                                    allLangs = allLangs.map(l => l.toLowerCase());

                                                    // Deduplicate
                                                    allLangs = Array.from(new Set(allLangs));

                                                    // Sort: Primary first
                                                    if (primary) {
                                                        allLangs.sort((a, b) => {
                                                            if (a === primary) return -1;
                                                            if (b === primary) return 1;
                                                            return 0; // Keep others as is
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
                                                                        to={`/section/${encodeURIComponent(industry)}`}
                                                                        style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }}
                                                                        onMouseEnter={e => e.currentTarget.style.color = '#e50914'}
                                                                        onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
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

                                    <div>
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
                                <div style={{ width: '120px', flexShrink: 0 }}>
                                    <img
                                        src={movie.posterUrl}
                                        alt={`${movie.title} Poster`}
                                        width="300"
                                        height="450"
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                            transition: 'transform 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                </div>
                            </div>

                            {/* Ratings Section - Hidden if 0 */}
                            {movie.rating > 0 && (
                                <div style={{ marginTop: '3rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Rating</h3>
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

                            {/* Related Articles Section */}
                            <RelatedArticlesSection movieId={movie.id} movieTitle={movie.title} />
                        </div>

                    </div>
                </div>



                <div className="movie-bottom-sections" style={{ marginTop: '2rem' }}>

                    <div style={{ marginTop: (movie.whyWatch && movie.whyWatch.length > 0) ? '2rem' : '0', marginBottom: '1.5rem' }}>
                        <MovieRecommendations currentMovie={movie} />
                    </div>


                    {/* Same Genre Section */}
                    {movie.tags && movie.tags.length > 0 && (
                        <HorizontalScrollSection
                            title={`More ${movie.tags[0]} Movies`}
                            data={movies
                                .filter(m => m.id !== movie.id && m.tags?.includes(movie.tags[0]) && isValidContent(m))
                                .sort((a, b) => {
                                    if (b.views !== a.views) return b.views - a.views;
                                    return b.rating - a.rating;
                                })
                                .slice(0, 10)
                            }
                            linkTo={`/section/${encodeURIComponent(movie.tags[0])}`}
                        />
                    )}

                    {/* Popular Cast 1 Section */}
                    {movie.cast && movie.cast.length > 0 && (
                        <HorizontalScrollSection
                            title={`Starring ${movie.cast[0].name}`}
                            data={movies
                                .filter(m => m.id !== movie.id && m.cast?.some(c => c.name === movie.cast![0].name) && isValidContent(m))
                                .sort((a, b) => b.views - a.views)
                                .slice(0, 10)
                            }
                            linkTo={movie.cast[0].id ? `/person/${movie.cast[0].id}` : undefined}
                        />
                    )}

                    {/* Popular Cast 2 Section */}
                    {movie.cast && movie.cast.length > 1 && (
                        <HorizontalScrollSection
                            title={`Starring ${movie.cast[1].name}`}
                            data={movies
                                .filter(m => m.id !== movie.id && m.cast?.some(c => c.name === movie.cast![1].name) && isValidContent(m))
                                .sort((a, b) => b.views - a.views)
                                .slice(0, 10)
                            }
                            linkTo={movie.cast[1].id ? `/person/${movie.cast[1].id}` : undefined}
                        />
                    )}

                    {/* Industry Section */}
                    {(() => {
                        const INDUSTRIES = [
                            'Bollywood', 'Tollywood', 'Kollywood', 'Mollywood', 'Sandalwood',
                            'Hollywood', 'Pollywood', 'Bengali Cinema', 'Marathi Cinema',
                            'K-Drama', 'Anime', 'Chinese Cinema'
                        ];
                        const industry = movie.tags?.find(t => INDUSTRIES.includes(t));

                        if (!industry) return null;

                        return (
                            <HorizontalScrollSection
                                title={`More from ${industry}`}
                                data={movies
                                    .filter(m => m.id !== movie.id && m.tags?.includes(industry) && isValidContent(m))
                                    .sort((a, b) => b.views - a.views)
                                    .slice(0, 10)
                                }
                                linkTo={`/section/${encodeURIComponent(industry)}`}
                            />
                        );
                    })()}


                    {/* Gallery Section */}
                    {movie.images && movie.images.length > 0 && (
                        <div style={{ marginTop: '4rem', marginBottom: '2rem' }}>
                            <div
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
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: '#888',
                                    fontSize: '1rem',
                                    transition: 'color 0.2s'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#888'}
                                >
                                    <span>{movie.images.length} Images</span>
                                    {isGalleryLoaded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {isGalleryLoaded && (
                                <div className="gallery-wrapper" style={{ position: 'relative' }}>
                                    {/* Left Scroll Button */}
                                    {showGalleryControls && (
                                        <button
                                            className="gallery-nav-button left-button"
                                            onClick={() => scrollGallery('left')}
                                            style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 10,
                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                padding: '10px',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                backdropFilter: 'blur(5px)'
                                            }}
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                    )}

                                    <div
                                        ref={galleryScrollRef}
                                        className="gallery-scroll-container"
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            overflowX: 'auto',
                                            paddingBottom: '1rem',
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none',
                                            WebkitOverflowScrolling: 'touch',
                                            scrollBehavior: 'smooth'
                                        }}
                                    >
                                        {movie.images.slice(0, galleryLimit).map((img, index) => (
                                            <div key={index}
                                                onClick={() => openGallery(index)}
                                                style={{
                                                    flex: '0 0 auto',
                                                    width: '280px',
                                                    height: '158px',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                                    backgroundColor: '#222',
                                                    cursor: 'pointer'
                                                }}>
                                                <img
                                                    src={img}
                                                    alt={`${movie.title} scene ${index + 1}`}
                                                    loading="lazy"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.3s ease'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                />
                                            </div>
                                        ))}

                                        {/* Load More Card */}
                                        {movie.images.length > galleryLimit && (
                                            <div
                                                onClick={() => setGalleryLimit(prev => prev + 10)}
                                                style={{
                                                    flex: '0 0 auto',
                                                    width: '280px',
                                                    height: '158px',
                                                    borderRadius: '8px',
                                                    border: '2px solid #333',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#1a1a1a',
                                                    transition: 'all 0.2s ease',
                                                    color: 'white'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.backgroundColor = '#222';
                                                    e.currentTarget.style.borderColor = 'white';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                                                    e.currentTarget.style.borderColor = '#333';
                                                }}
                                            >
                                                <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</span>
                                                <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Load More</span>
                                                <span style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>
                                                    ({movie.images.length - galleryLimit} more)
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Scroll Button */}
                                    {showGalleryControls && (
                                        <button
                                            className="gallery-nav-button right-button"
                                            onClick={() => scrollGallery('right')}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 10,
                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                padding: '10px',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                backdropFilter: 'blur(5px)'
                                            }}
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    )}
                                </div>
                            )}

                        </div>
                    )}

                    {/* Gallery Lightbox */}
                    {
                        selectedImageIndex !== null && movie.images && (
                            <div
                                className="lightbox-container"
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'rgba(0,0,0,0.95)',
                                    zIndex: 3000,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(5px)'
                                }}
                                onClick={closeGallery}
                            >

                                {/* Close Button */}
                                <button
                                    onClick={closeGallery}
                                    style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '2rem',
                                        cursor: 'pointer',
                                        zIndex: 3001,
                                        padding: '10px'
                                    }}
                                >
                                    &times;
                                </button>

                                {/* Left Arrow */}
                                <button
                                    className="lightbox-nav-button"
                                    onClick={prevImage}
                                    style={{
                                        position: 'absolute',
                                        left: '20px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        padding: '1rem',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 3001
                                    }}
                                >
                                    <ArrowLeft size={24} />
                                </button>

                                {/* Main Image */}
                                <div style={{
                                    maxWidth: '90%',
                                    maxHeight: '90%',
                                    position: 'relative'
                                }} onClick={e => e.stopPropagation()}>
                                    <img
                                        src={movie.images[selectedImageIndex]}
                                        alt={`${movie.title} full`}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '90vh',
                                            objectFit: 'contain',
                                            borderRadius: '4px',
                                            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                                        }}
                                    />
                                    <div style={{
                                        textAlign: 'center',
                                        marginTop: '1rem',
                                        color: '#888',
                                        fontSize: '0.9rem'
                                    }}>
                                        {selectedImageIndex + 1} / {movie.images.length}
                                    </div>
                                </div>

                                {/* Right Arrow */}
                                <button
                                    className="lightbox-nav-button"
                                    onClick={nextImage}
                                    style={{
                                        position: 'absolute',
                                        right: '20px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        padding: '1rem',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 3001,
                                        transform: 'rotate(180deg)'
                                    }}
                                >
                                    <ArrowLeft size={24} />
                                </button>

                            </div>
                        )
                    }

                    <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Lightbox Navigation Buttons */
                .lightbox-nav-button {
                    opacity: 1; /* Default visible */
                }

                .lightbox-nav-button:hover {
                    background-color: rgba(255,255,255,0.2) !important; /* Hover effect for background */
                }


                @media (min-width: 768px) {
                    .lightbox-nav-button {
                        opacity: 0 !important; /* Hidden on desktop by default */
                        transition: opacity 0.3s ease, background-color 0.2s ease; /* Smooth transition */
                    }

                    .lightbox-container:hover .lightbox-nav-button {
                        opacity: 1 !important; /* Visible on container hover */
                    }
                    
                    /* Gallery Scroll Buttons Desktop Logic */
                    .gallery-nav-button {
                         opacity: 0;
                         transition: opacity 0.3s ease;
                    }
                    .gallery-wrapper:hover .gallery-nav-button {
                        opacity: 1;
                    }
                }
            `}</style>
                    {
                        playingTrailerId && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(0,0,0,0.95)',
                                zIndex: 2000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2rem'
                            }} onClick={() => setPlayingTrailerId(null)}>
                                <button
                                    onClick={() => setPlayingTrailerId(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        color: 'white',
                                        cursor: 'pointer',
                                        padding: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background 0.2s',
                                        zIndex: 2001 // Ensure it's above the video container
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                                >
                                    <X size={32} />
                                </button>

                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '1200px',
                                    aspectRatio: '16/9',
                                    backgroundColor: 'black',
                                    boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                }} onClick={(e) => e.stopPropagation()}>
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${playingTrailerId}?autoplay=1`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </div>
                        )
                    }
                    <Footer />
                </div>
            </div>
        </div>
    );
};


export default MoviePage;
