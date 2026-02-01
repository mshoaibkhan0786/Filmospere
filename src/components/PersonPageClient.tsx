'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, User, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Twitter, Instagram, Facebook } from 'lucide-react';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './MovieCardSkeleton';
import Footer from './Footer';
import type { Movie, ActorDetails } from '../types';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface PersonPageClientProps {
    person: ActorDetails;
    movies: Movie[]; // All relevant movies passed from server
}

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
};

const PersonPageClient: React.FC<PersonPageClientProps> = ({ person, movies }) => {
    const router = useRouter();
    const [displayLimit, setDisplayLimit] = useState(30);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [isBackHovered, setIsBackHovered] = useState(false);

    // Derived: Genres
    const availableGenres = useMemo(() => {
        const genres = new Set<string>();
        movies.forEach(movie => {
            if (movie.tags && movie.tags.length > 0) {
                movie.tags.forEach((t: string) => genres.add(t));
            }
        });
        return ['All', ...Array.from(genres).sort()];
    }, [movies]);

    // Derived: Filtered Movies
    const filteredMovies = useMemo(() => {
        if (selectedGenres.length === 0) return movies;
        return movies.filter(movie => selectedGenres.every(g => movie.tags?.includes(g)));
    }, [movies, selectedGenres]);

    // Derived: Displayed Movies (Pagination)
    const displayedMovies = useMemo(() => {
        return filteredMovies.slice(0, displayLimit);
    }, [filteredMovies, displayLimit]);

    const toggleGenre = (genre: string) => {
        setDisplayLimit(30);
        if (genre === 'All') {
            setSelectedGenres([]);
            return;
        }
        setSelectedGenres(prev => {
            if (prev.includes(genre)) {
                return prev.filter(g => g !== genre);
            } else {
                return [...prev, genre];
            }
        });
    };

    // Infinite Scroll / Load More Logic
    const loaderRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting) {
                if (displayedMovies.length < filteredMovies.length) {
                    setDisplayLimit(prev => prev + 30);
                }
            }
        }, { threshold: 0.1, rootMargin: '200px' });

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [displayedMovies.length, filteredMovies.length]);


    // Gallery Logic
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [isGalleryLoaded, setIsGalleryLoaded] = useState(false);
    const [showGalleryControls, setShowGalleryControls] = useState(false);
    const galleryScrollRef = useRef<HTMLDivElement>(null);

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

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedImageIndex !== null && person.images) {
            setSelectedImageIndex((selectedImageIndex + 1) % person.images.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedImageIndex !== null && person.images) {
            setSelectedImageIndex((selectedImageIndex - 1 + person.images.length) % person.images.length);
        }
    };

    const scrollGallery = (direction: 'left' | 'right') => {
        if (galleryScrollRef.current) {
            const scrollAmount = 500;
            galleryScrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Computed credits count
    const creditsCount = Math.max(
        person.movie_credits?.cast?.length || 0,
        person.movie_credits?.crew?.filter(c => c.job === 'Director').length || 0,
        movies.length
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white', display: 'flex', flexDirection: 'column' }}>

            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(to bottom, #1f1f1f 0%, #141414 100%)',
                position: 'relative',
                marginBottom: '2rem'
            }}>


                <div className="container actor-hero">
                    {/* Left Column: Image */}
                    <div className="actor-image-container" style={{ position: 'relative' }}>
                        {person.profile_path ? (
                            <Image
                                src={getOptimizedImageUrl(person.profile_path, 500)}
                                alt={person.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 300px"
                                style={{ objectFit: 'cover' }}
                                priority
                                unoptimized={true}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                <User size={64} />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Info */}
                    <div className="actor-info">
                        <h1 className="actor-name" style={{ fontWeight: '800', marginBottom: '0.5rem', lineHeight: '1.1' }}>{person.name}</h1>
                        <div className="actor-known-for" style={{ color: '#e50914', marginBottom: '1.5rem', fontWeight: '500' }}>
                            Known for {creditsCount} {creditsCount === 1 ? 'Movie' : 'Movies'}
                        </div>

                        <div className="actor-stats-grid">
                            {person.birthday && (
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Born</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{formatDate(person.birthday)}</div>
                                </div>
                            )}
                            {person.place_of_birth && (
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Place of Birth</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{person.place_of_birth}</div>
                                </div>
                            )}
                            {person.known_for_department && (
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Department</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{person.known_for_department}</div>
                                </div>
                            )}
                        </div>

                        {/* Social Links */}
                        {person.external_ids && (
                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>

                                {person.external_ids.twitter_id && (
                                    <a href={`https://twitter.com/${person.external_ids.twitter_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#1DA1F2'} onMouseLeave={e => e.currentTarget.style.color = '#aaa'}>
                                        <Twitter size={24} />
                                    </a>
                                )}
                                {person.external_ids.instagram_id && (
                                    <a href={`https://instagram.com/${person.external_ids.instagram_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#C13584'} onMouseLeave={e => e.currentTarget.style.color = '#aaa'}>
                                        <Instagram size={24} />
                                    </a>
                                )}
                                {person.external_ids.facebook_id && (
                                    <a href={`https://facebook.com/${person.external_ids.facebook_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#4267B2'} onMouseLeave={e => e.currentTarget.style.color = '#aaa'}>
                                        <Facebook size={24} />
                                    </a>
                                )}
                            </div>
                        )}

                        {person.biography ? (
                            <p style={{
                                color: '#ccc',
                                lineHeight: '1.7',
                                fontSize: '1rem',
                                marginBottom: '2rem',
                                maxWidth: '800px',
                                whiteSpace: 'pre-line'
                            }}>
                                {person.biography}
                            </p>
                        ) : (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>Biography not available.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Filmography Section */}
            <div className="container" style={{ paddingBottom: '4rem', flex: 1 }}>
                <h2 className="actor-filmography-title" style={{
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    borderLeft: '4px solid #e50914',
                    paddingLeft: '1rem'
                }}>
                    Filmography
                </h2>

                {/* Genre Filters */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem',
                    marginBottom: '2rem',
                    scrollbarWidth: 'none'
                }}>
                    {availableGenres.map(genre => {
                        const isSelected = genre === 'All'
                            ? selectedGenres.length === 0
                            : selectedGenres.includes(genre);

                        return (
                            <button
                                key={genre}
                                onClick={() => toggleGenre(genre)}
                                className="section-genre-button"
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '24px',
                                    border: isSelected ? '1px solid #e50914' : '1px solid #444',
                                    backgroundColor: isSelected ? '#e50914' : 'transparent',
                                    color: isSelected ? 'white' : '#aaa',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = '#888';
                                        e.currentTarget.style.color = 'white';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = '#444';
                                        e.currentTarget.style.color = '#aaa';
                                    }
                                }}
                            >
                                {genre}
                            </button>
                        );
                    })}
                </div>

                {displayedMovies.length === 0 ? (
                    <div style={{ color: '#666', fontStyle: 'italic', padding: '2rem', textAlign: 'center' }}>
                        No movies found in this category.
                    </div>
                ) : (
                    <div className="cols-6-grid">
                        {displayedMovies.map(movie => (
                            <MovieCard
                                key={movie.id}
                                movie={movie}
                                onClick={(m) => router.push(`/movie/${m.slug || m.id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Sentinel for Infinite Scroll (Client Side) */}
                {displayedMovies.length < filteredMovies.length && (
                    <div ref={loaderRef} style={{ marginTop: '2rem' }}>
                        <div className="cols-6-grid">
                            {[...Array(6)].map((_, i) => (
                                <MovieCardSkeleton key={`skeleton-loadmore-${i}`} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Gallery Section */}
            {person.images && person.images.length > 0 && (
                <div className="container" style={{ marginTop: 'auto', marginBottom: '2rem' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888' }}>
                            <span>{person.images.length} Images</span>
                            {isGalleryLoaded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </div>

                    {isGalleryLoaded && (
                        <div className="gallery-wrapper" style={{ position: 'relative' }}
                            onMouseEnter={() => setShowGalleryControls(true)}
                            onMouseLeave={() => setShowGalleryControls(false)}
                        >
                            {/* Scroll Buttons */}
                            {showGalleryControls && (
                                <>
                                    <button
                                        onClick={() => scrollGallery('left')}
                                        style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', padding: '10px', color: 'white', cursor: 'pointer' }}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={() => scrollGallery('right')}
                                        style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', padding: '10px', color: 'white', cursor: 'pointer' }}
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}

                            <div
                                ref={galleryScrollRef}
                                className="gallery-scroll-container"
                                style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none', scrollBehavior: 'smooth' }}
                            >
                                {person.images.map((img, index) => (
                                    <div key={index} onClick={() => openGallery(index)} style={{ flex: '0 0 auto', width: '200px', height: '113px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                                        <Image
                                            src={getOptimizedImageUrl(img, 300)}
                                            alt={`${person.name} gallery ${index}`}
                                            fill
                                            sizes="200px"
                                            style={{ objectFit: 'cover' }}
                                            unoptimized={!!img.includes('wsrv.nl')}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Lightbox */}
            {selectedImageIndex !== null && person.images && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={closeGallery}
                >
                    <button onClick={closeGallery} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 3001 }}>
                        <X size={32} />
                    </button>
                    <button onClick={prevImage} style={{ position: 'absolute', left: '20px', color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '1rem', cursor: 'pointer', zIndex: 3001 }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ position: 'relative', width: '90vw', height: '90vh' }}>
                        <Image
                            src={getOptimizedImageUrl(person.images[selectedImageIndex], 1280)}
                            alt="Gallery"
                            fill
                            style={{ objectFit: 'contain' }}
                            sizes="90vw"
                            priority
                            onClick={e => e.stopPropagation()}
                            unoptimized={!!person.images[selectedImageIndex].includes('wsrv.nl')}
                        />
                    </div>
                    <button onClick={nextImage} style={{ position: 'absolute', right: '20px', color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '1rem', cursor: 'pointer', zIndex: 3001 }}>
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default PersonPageClient;
