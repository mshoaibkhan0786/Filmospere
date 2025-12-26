import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import FeaturedHero from '../components/FeaturedHero';
import HeroSkeleton from '../components/HeroSkeleton';
import HorizontalScrollSection from '../components/HorizontalScrollSection';
import Footer from '../components/Footer';
import { useMovies } from '../context/MovieContext';
import { useConfig } from '../context/ConfigContext';
import { isValidContent } from '../utils/formatUtils';
import { getUserPreferences, getSmartSortedMovies } from '../utils/recommendationUtils';
import { Helmet } from 'react-helmet-async';

const Home: React.FC = () => {
    const { movies, isLoading, searchMovies, fetchMoviesByTag } = useMovies();
    const { sections: configSections } = useConfig();

    // Prevent infinite fetches and track offsets
    const fetchedOffsets = React.useRef<Record<string, number>>({});

    // URL Search Params Integration
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('search') || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);

    // const [visibleCount, setVisibleCount] = useState(42);
    const [renderedSectionCount, setRenderedSectionCount] = useState(3);
    const navigate = useNavigate();

    // Async Search State
    const [dbSearchResults, setDbSearchResults] = useState<typeof movies>([]);
    const [totalSearchCount, setTotalSearchCount] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    // const [isCountLoading, setIsCountLoading] = useState(false);
    // const [searchOffset, setSearchOffset] = useState(0);

    // Sync State -> URL (When user types)
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        const newParams = new URLSearchParams(searchParams);
        if (query) {
            newParams.set('search', query);
        } else {
            newParams.delete('search');
        }
        setSearchParams(newParams, { replace: true });
    };

    // Sync URL -> State (When navigating back/forward or from another page)
    useEffect(() => {
        const query = searchParams.get('search') || '';
        if (query !== searchQuery) {
            setSearchQuery(query);
        }
    }, [searchParams]);

    useEffect(() => {
        // setVisibleCount(42);
    }, [searchQuery]);

    const searchResults = dbSearchResults;

    // Execute Search with Debounce
    useEffect(() => {
        if (!searchQuery) {
            setDbSearchResults([]);
            setTotalSearchCount(0);
            return;
        }

        let isCancelled = false;

        const timer = setTimeout(async () => {
            if (isCancelled) return;

            setIsSearching(true);
            try {
                // Fetch results and count in one call
                const { results, count } = await searchMovies(searchQuery, 0, 42);

                // Only update state if this request is still relevant (not cancelled)
                if (!isCancelled) {
                    setDbSearchResults(results);
                    setTotalSearchCount(count);
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error(err);
                    setDbSearchResults([]);
                    setTotalSearchCount(0);
                }
            } finally {
                if (!isCancelled) {
                    setIsSearching(false);
                }
            }
        }, 300);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [searchQuery, searchMovies]);

    // Infinite scroll for search results - server-side pagination
    useEffect(() => {
        if (!searchQuery || dbSearchResults.length >= totalSearchCount || isLoadingMore) return;

        const handleScroll = () => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const documentHeight = document.documentElement.scrollHeight;

            // Load more when 80% down the page
            if (scrollPosition >= documentHeight * 0.8 && dbSearchResults.length < totalSearchCount) {
                setIsLoadingMore(true);
                const offset = dbSearchResults.length;

                // Fetch next 42 results (7 rows) from server
                searchMovies(searchQuery, offset, 42)
                    .then(({ results }) => {
                        if (results.length > 0) {
                            setDbSearchResults(prev => [...prev, ...results]);
                        }
                        setIsLoadingMore(false);
                    })
                    .catch(err => {
                        console.error('Failed to load more:', err);
                        setIsLoadingMore(false);
                    });
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, dbSearchResults.length, totalSearchCount, isLoadingMore]);

    const sections = useMemo(() => {
        if (searchQuery) return [];

        // 1. Get User Preferences Upfront
        let topGenre = '';
        try {
            const stored = localStorage.getItem('userGenrePreferences');
            if (stored) {
                const prefs: Record<string, number> = JSON.parse(stored);
                // Find top genre
                const sortedGenres = Object.entries(prefs).sort((a, b) => b[1] - a[1]);
                if (sortedGenres.length > 0) {
                    topGenre = sortedGenres[0][0];
                }
            }
        } catch (e) { /* ignore */ }

        // Memoized Valid Filtering
        const validMovies = movies.filter(isValidContent);

        // Smart Sort: Personalization + Sticky + Freshness
        const prefs = getUserPreferences();
        const smartSortedMovies = getSmartSortedMovies(validMovies, prefs);

        const currentYear = new Date().getFullYear();
        const allSections: { title: string; data: typeof movies }[] = [];


        configSections.forEach(config => {
            if (!config.visible) return;
            if (config.id === 'trending') return;

            let data: typeof movies = [];

            if (config.id === 'trending') {
                data = movies
                    .filter(m => isValidContent(m))
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 10);
            } else {
                const source = smartSortedMovies; // Restoration of Smart Shuffle

                if (config.id === 'latest') {
                    // Filter Latest: Always include Current & Previous Year for stability
                    // Use personalized source sort
                    data = source
                        .filter(m => m.releaseYear === currentYear || m.releaseYear === currentYear - 1);
                } else if (config.id === 'series') {
                    // Filter Series
                    data = source.filter(m => m.contentType === 'series');
                } else if (config.id === 'discover') {
                    data = [...source];
                } else if (config.type === 'custom' && config.query) {
                    // Filter Custom Section
                    const query = config.query.toLowerCase().trim();
                    data = source.filter(m =>
                        m.tags?.some(tag => tag.toLowerCase().trim() === query)
                    );
                }
            }

            if (data.length > 0) {
                allSections.push({ title: config.title, data });
            }
        });

        // REORDERING LOGIC FOR PERSONALIZATION
        // Move the User's Top Genre Section to the 4th Position (Index 3), after Trending(0), Latest(1), Series(2)
        if (topGenre) {
            // Find the index of the section matching this genre
            const genreSectionIndex = allSections.findIndex(s => s.title === topGenre || s.title.includes(topGenre));

            // Only move if it exists and isn't already in the top 3
            if (genreSectionIndex > 3) {
                // Remove it
                const [section] = allSections.splice(genreSectionIndex, 1);
                // Insert at position 3 (After Trending, Latest, Series)
                allSections.splice(3, 0, section);
            }
        }

        return allSections;
    }, [searchQuery, movies, configSections]);

    // Progressive loading of sections
    const observerTarget = React.useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setRenderedSectionCount(prev => {
                        if (prev >= sections.length) return prev;
                        return prev + 3; // Load 3 more sections at a time
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

    const [featuredMovie, setFeaturedMovie] = useState<typeof movies[0] | null>(null);

    useEffect(() => {
        // If we already have a featured movie, don't switch it (avoids flicker when bg movies load)
        if (featuredMovie) return;

        if (isLoading || movies.length === 0) return;

        const currentYear = new Date().getFullYear();
        // 1. Filter for movies from the current year AND ensure they have a description
        const currentYearMovies = movies.filter(m => m.releaseYear === currentYear && m.description && m.description.length > 0);

        if (currentYearMovies.length === 0) return;

        // 2. Prefer movies with banners
        const candidatesWithBanners = currentYearMovies.filter(m => m.images && m.images.length > 0);
        const pool = candidatesWithBanners.length > 0 ? candidatesWithBanners : currentYearMovies;

        // Random pick
        const selection = pool[Math.floor(Math.random() * pool.length)];
        setFeaturedMovie(selection);
    }, [isLoading, movies, featuredMovie]);

    // Generate structured data for SEO
    const schemaData = useMemo(() => {
        const trendingSection = sections.find(s => s.title === 'Trending') || sections[0];
        const schemaMovies = trendingSection ? trendingSection.data.slice(0, 10) : [];

        const websiteSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Filmospere",
            "url": "https://filmospere.com",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://filmospere.com/?search={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        };

        const itemListSchema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": schemaMovies.map((movie, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@type": "Movie",
                    "name": movie.title,
                    "image": movie.posterUrl,
                    "url": `https://filmospere.com/movie/${movie.slug || movie.id}`,
                    "dateCreated": movie.releaseYear.toString(),
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": movie.rating,
                        "bestRating": "10",
                        "worstRating": "1",
                        "ratingCount": movie.voteCount || 100
                    }
                }
            }))
        };
        return [websiteSchema, itemListSchema];
    }, [sections]);

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Helmet>
                <title>Filmospere - Discover Movies & Series</title>
                <meta name="description" content="Filmospere is your ultimate destination for discovering movies and TV series. Explore trending titles, browse by genre, and find where to watch your favorites." />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://filmospere.com/" />
                <meta property="og:title" content="Filmospere - Discover Movies & Series" />
                <meta property="og:description" content="Filmospere is your ultimate destination for discovering movies and TV series. Explore trending titles, browse by genre, and find where to watch your favorites." />
                <meta property="og:image" content="https://filmospere.com/favicon.png" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content="Filmospere - Discover Movies & Series" />
                <meta name="twitter:description" content="Filmospere is your ultimate destination for discovering movies and TV series. Explore trending titles, browse by genre, and find where to watch your favorites." />
                <meta name="twitter:image" content="https://filmospere.com/favicon.png" />

                <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
            </Helmet>
            <Navbar onSearch={handleSearch} initialSearchTerm={initialQuery} />

            {/* Featured Hero (Only on Home, no search) */}
            {!searchQuery && !isLoading && featuredMovie && (
                <FeaturedHero movie={featuredMovie} />
            )}

            {isLoading && !searchQuery && <HeroSkeleton />}

            <main className="container" style={{ position: 'relative', zIndex: 20 }}>
                {searchQuery ? (
                    <>
                        <div className="home-search-results" style={{ marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                Search Results for "{searchQuery}"
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', minHeight: '1.5rem' }}>
                                {!isSearching && `Found ${totalSearchCount} results`}
                            </p>
                        </div>

                        {isSearching ? (
                            <div className="cols-6-grid">
                                {[...Array(12)].map((_, i) => (
                                    <MovieCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : searchResults.length > 0 ? (
                            <>
                                <div className="cols-6-grid">
                                    {searchResults.map((movie, index) => (
                                        <MovieCard
                                            key={`${movie.id}-${index}`}
                                            movie={movie}
                                            onClick={(movie) => navigate(`/movie/${movie.slug || movie.id}`)}
                                        />
                                    ))}
                                </div>

                                {/* Show skeleton while loading more */}
                                {isLoadingMore && (
                                    <div className="cols-6-grid" style={{ marginTop: '2rem' }}>
                                        {[...Array(12)].map((_, i) => (
                                            <MovieCardSkeleton key={`loading-${i}`} />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                <p>No content found matching your criteria.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="home-page-sections" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginTop: featuredMovie || isLoading ? '0' : '2rem' }}>
                        {isLoading ? (
                            // Show a few skeleton sections while loading
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
                                        linkTo={`/section/${encodeURIComponent(section.title)}`}
                                        onEndReached={() => {
                                            // Find config key for this section title
                                            // Clean title from debug count first if present
                                            const cleanTitle = section.title.split(' (')[0];
                                            const config = configSections.find(c => c.title === cleanTitle);

                                            if (config && config.type === 'custom' && config.query) {
                                                const tag = config.query;
                                                // Assume 50 loaded initially by fetchMoviesByTag default or lazy load limit
                                                const currentOffset = fetchedOffsets.current[tag] || 0;
                                                // The lazy load (useEffect) fetched LIMIT 50. 
                                                // If we want to fetch the NEXT 10, we should set offset to 50?
                                                // Actually, if we initially loaded 50, user has plenty.
                                                // If user wants "Fetch 7-8.. then fetch 5", we should have started with limit 10.

                                                // For now, let's just fetch +20 from wherever we are.
                                                // If we haven't tracked offset, assume we have whatever length is currently there?
                                                // Or safer: assume 50 for now, then +20.
                                                // const nextOffset = currentOffset + (currentOffset === 0 ? 12 : 20);

                                                if (currentOffset === 0) {
                                                    fetchedOffsets.current[tag] = 12; // Sync with initial load
                                                }

                                                // Actually, simplest: just keep adding 20.
                                                // But Supabase fetch merges.

                                                // Let's implement start = movies.length for that tag? Hard to count efficiently.
                                                // Let's just track offsets manually.
                                                const offsetToFetch = fetchedOffsets.current[tag] || 12;

                                                // Reached end, fetching more
                                                fetchMoviesByTag(tag, offsetToFetch, 20);
                                                fetchedOffsets.current[tag] = offsetToFetch + 20;
                                            }
                                        }}
                                    />
                                ))}
                                {/* Sentinel for Infinite Scroll - Only render if there are more sections to show */}
                                {renderedSectionCount < sections.length && (
                                    <div
                                        ref={observerTarget}
                                        style={{ height: '20px', margin: '1rem 0' }}
                                    />
                                )}
                            </>
                        )}

                        {!isLoading && sections.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                <p>No content available.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Home;
