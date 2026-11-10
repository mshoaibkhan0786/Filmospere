"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import FeaturedHero from './FeaturedHero';
import HeroSkeleton from './HeroSkeleton';
import HorizontalScrollSection from './HorizontalScrollSection';
import { useMovies } from '../context/MovieContext';
import { useConfig } from '../context/ConfigContext';
import { isValidContent } from '../utils/formatUtils';
import { getUserPreferences, getSmartSortedMovies } from '../utils/recommendationUtils';
import type { Movie } from '../types';

interface HomeClientProps {
    initialMovies: Movie[];
    initialSections: any[]; // Config + Data structure
}

const HomeClient: React.FC<HomeClientProps> = ({ initialMovies, initialSections }) => {
    const { movies: contextMovies, isLoading, fetchMoviesByTag } = useMovies();
    const { sections: configSections } = useConfig();

    // Prevent infinite fetches and track offsets
    const fetchedOffsets = useRef<Record<string, number>>({});

    // Progressive rendering state
    const [renderedSectionCount, setRenderedSectionCount] = useState(3);


    // MAIN CONTENT LOGIC
    // Use Server Props initially, then switch to Context if it Updates?
    // Actually, "Smart Sort" relies on LocalStorage which is Client Side.
    // So we MUST re-calculate sections on client.

    // We use `contextMovies` (from useMovies) as the source of truth because it allows caching/updates.
    // If context is empty initially (loading), we might fallback to `initialMovies` passed from Server?
    // BUT `useMovies` usually fetches on mount. 
    // To avoid double-fetch, we could hydrate properties.
    // For now, let's allow `useMovies` to do its thing, but `initialMovies` from server helps LCP.

    const activeMovies = contextMovies.length > 0 ? contextMovies : initialMovies;

    const sections = useMemo(() => {
        // 1. Get User Preferences Upfront
        let topGenre = '';
        try {
            const stored = localStorage.getItem('userGenrePreferences');
            if (stored) {
                const prefs: Record<string, number> = JSON.parse(stored);
                const sortedGenres = Object.entries(prefs).sort((a, b) => b[1] - a[1]);
                if (sortedGenres.length > 0) {
                    topGenre = sortedGenres[0][0];
                }
            }
        } catch (e) { /* ignore */ }

        // Memoized Valid Filtering
        const validMovies = activeMovies.filter(isValidContent);

        // Smart Sort: Personalization + Sticky + Freshness
        const prefs = getUserPreferences();
        const smartSortedMovies = getSmartSortedMovies(validMovies, prefs);

        const currentYear = new Date().getFullYear();
        const allSections: { title: string; data: Movie[], id?: string, type?: string, query?: string }[] = [];

        configSections.forEach(config => {
            if (!config.visible) return;
            // Skip trending here if we treat it specially, but original logic handled it inside loop
            // Wait, original logic: "if (config.id === 'trending') return;" then handles it?
            // Actually original code had:
            // if (config.id === 'trending') return; // wait... 
            // Looking at snippet provided earlier:
            // if (config.id === 'trending') { ... } else { ... }
            // Ah, the snippet had a logic branch.

            let data: Movie[] = [];

            if (config.id === 'trending') {
                data = activeMovies
                    .filter(m => isValidContent(m))
                    .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
                    .slice(0, 10);
            } else {
                const source = smartSortedMovies;

                if (config.id === 'latest') {
                    // Filter Latest
                    data = source
                        .filter(m => m.releaseYear === currentYear || m.releaseYear === currentYear - 1);
                } else if (config.id === 'series') {
                    // Filter Series
                    data = source.filter(m => m.contentType === 'series');
                } else if (config.id === 'discover') {
                    data = [...source];
                } else if (config.type === 'custom' && config.query) {
                    const query = config.query.toLowerCase().trim();
                    data = source.filter(m =>
                        m.tags?.some(tag => tag.toLowerCase().trim() === query)
                    );
                }
            }

            // CRITICAL FALLBACK: If Client-side filtering returns 0 items,
            // check if we have data in the Server-Provided initialSections (from Cache).
            // This ensures that if the cache has "Action" movies but Client logic misses them (e.g. valid check),
            // we still show the cached content.
            if (data.length === 0) {
                const cachedSection = initialSections.find(s => s.title === config.title);
                if (cachedSection && cachedSection.data && cachedSection.data.length > 0) {
                    data = cachedSection.data;
                }
            }

            if (data.length > 0) {
                allSections.push({
                    title: config.title,
                    data,
                    id: config.id,
                    type: config.type,
                    query: config.query
                });
            }
        });

        // REORDERING LOGIC FOR PERSONALIZATION
        // Move the User's Top Genre Section to the 4th Position
        if (topGenre) {
            const genreSectionIndex = allSections.findIndex(s => s.title === topGenre || s.title.includes(topGenre));
            if (genreSectionIndex > 3) {
                const [section] = allSections.splice(genreSectionIndex, 1);
                allSections.splice(3, 0, section);
            }
        }

        return allSections;
    }, [activeMovies, configSections]);

    // Progressive loading of sections
    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setRenderedSectionCount(prev => {
                        if (prev >= sections.length) return prev;
                        return prev + 3;
                    });
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [sections.length]);


    // Featured Movie Logic (Client Side Randomness)
    const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);

    useEffect(() => {
        if (featuredMovie) return;
        if (activeMovies.length === 0) return;

        const currentYear = new Date().getFullYear();
        const today = new Date();

        // 1. Filter for valid Hero candidates
        const currentYearMovies = activeMovies.filter(m => {
            if (m.releaseYear !== currentYear && m.releaseYear !== currentYear - 1) return false;
            if (!m.description || m.description.length === 0) return false;
            // if (m.status && m.status !== 'Released') return false; // Optional depending on strictness
            if (m.releaseDate) {
                const rDate = new Date(m.releaseDate);
                if (!isNaN(rDate.getTime()) && rDate > today) return false;
            }
            // Improved Duration Check (Handles "0 min", 0, null)
            const durationVal = parseInt(String(m.duration || '0'));
            if (!durationVal || durationVal <= 0) return false;

            return true;
        });

        if (currentYearMovies.length === 0) {
            // Fallback to any valid movie if current year is empty
            if (activeMovies.length > 0) setFeaturedMovie(activeMovies[0]);
            return;
        }

        // 2. Prefer movies with banners
        const candidatesWithBanners = currentYearMovies.filter(m => m.images && m.images.length > 0);
        const pool = candidatesWithBanners.length > 0 ? candidatesWithBanners : currentYearMovies;

        // Deterministic Selection (Rotate Hourly)
        // This prevents the banner from changing on every refresh, but keeps it dynamic over the day.
        const currentHour = new Date().getHours();
        const index = currentHour % pool.length;
        setFeaturedMovie(pool[index]);
    }, [activeMovies, featuredMovie]);


    return (
        <>
            {isLoading && !featuredMovie ? <HeroSkeleton /> : featuredMovie && <FeaturedHero movie={featuredMovie} />}

            <main className="container" style={{ position: 'relative', zIndex: 20 }}>
                {/* SEO H1: Visually hidden but accessible to crawlers */}
                <h1 style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: -1,
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0
                }}>
                    Filmospere - Discover Movies, Web Series & Anime
                </h1>

                <div className="home-page-sections" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginTop: featuredMovie || isLoading ? '0' : '2rem' }}>
                    {sections.length === 0 && isLoading && activeMovies.length === 0 ? (
                        // Show Skeletons ONLY if we have absolutely no data (context or initial)
                        ['Latest Movies & Series', 'Action', 'Drama'].map((title, index) => (
                            <HorizontalScrollSection
                                key={index}
                                title={title}
                                data={[]}
                                loading={true}
                            />
                        ))
                    ) : (
                        <>
                            {sections.slice(0, renderedSectionCount).map((section, index) => (
                                <HorizontalScrollSection
                                    key={`${section.title}-${index}`}
                                    title={section.title}
                                    data={section.data}
                                    loading={false}
                                    linkTo={
                                        section.id === 'series'
                                            ? '/section/web-series'
                                            : section.id === 'latest'
                                                ? '/section/new-releases'
                                                : (section.type === 'custom' && section.query
                                                    ? `/section/${(() => {
                                                        const slug = section.query.toLowerCase().replace(/\s+/g, '-');
                                                        return slug === 'sci-fi' ? 'science-fiction' : slug;
                                                    })()}`
                                                    : (section.id ? `/section/${section.id}` : undefined))
                                    }
                                    onEndReached={() => {
                                        const cleanTitle = section.title.split(' (')[0];
                                        const config = configSections.find(c => c.title === cleanTitle);

                                        if (config && config.type === 'custom' && config.query) {
                                            const tag = config.query;
                                            const currentOffset = fetchedOffsets.current[tag] || 0;

                                            if (currentOffset === 0) {
                                                fetchedOffsets.current[tag] = 12;
                                            }

                                            const offsetToFetch = fetchedOffsets.current[tag] || 12;
                                            fetchMoviesByTag(tag, offsetToFetch, 20);
                                            fetchedOffsets.current[tag] = offsetToFetch + 20;
                                        }
                                    }}
                                />
                            ))}
                            {renderedSectionCount < sections.length && (
                                <div
                                    ref={observerTarget}
                                    style={{ height: '20px', margin: '1rem 0' }}
                                />
                            )}
                        </>
                    )}

                    {!isLoading && sections.length === 0 && activeMovies.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                            <p>No content available.</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
};

export default HomeClient;
