"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowLeft, Menu, X } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import Logo from './Logo';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import MobileMenu from './MobileMenu';

import './Navbar.css';

interface NavbarProps {
    onSearch?: (query: string) => void; // Optional in Next.js as we might handle search globally
    showBackArrow?: boolean;
    initialSearchTerm?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, showBackArrow = false, initialSearchTerm = '' }) => {
    const { settings } = useConfig();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize state with URL param if available, fallback to prop
    const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || initialSearchTerm);

    const [isExpanded, setIsExpanded] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const ignoreParamsSync = useRef(false);

    // Sync state with URL changes (e.g. Back button or reload)
    useEffect(() => {
        // If we deliberately cleared the search via UI, ignore the immediate strict sync
        // until the URL actually updates to empty.
        if (ignoreParamsSync.current) {
            // Check if URL has actually caught up (became empty)
            const query = searchParams?.get('search') || '';
            if (!query) {
                // Reset flag once we match the empty state we requested
                ignoreParamsSync.current = false;
            }
            return;
        }

        const query = searchParams?.get('search') || '';
        if (query !== searchTerm) {
            setSearchTerm(query);
            // Auto-expand if there is a query
            if (query) {
                setIsExpanded(true);
            }
        }
    }, [searchParams]);

    // ... (rest of component)

    if (pathname.startsWith('/admin')) {
        return null;
    }
    const [isScrolled, setIsScrolled] = useState(false);
    const [isBackHovered, setIsBackHovered] = useState(false);

    useEffect(() => {
        // Focus logic if initialSearchTerm provided (mostly legacy prop usage now)
        if (initialSearchTerm) {
            setIsExpanded(true);
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.setSelectionRange(initialSearchTerm.length, initialSearchTerm.length);
                }
            }, 100);
        }
    }, [initialSearchTerm]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Debounce timer ref
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (onSearch) {
            onSearch(value);
        } else {
            // Debounced Navigation
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            debounceTimer.current = setTimeout(() => {
                const targetPath = value.trim() ? `/?search=${encodeURIComponent(value)}` : '/';
                router.replace(targetPath, { scroll: false });
            }, 300); // 300ms delay
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            setIsExpanded(false);
            if (onSearch) {
                // If parent handles search (e.g. live filter), let it do so.
                // But for pure Next.js pages, we usually route. 
                // Let's assume onSearch is for "Live Filter" scenarios if they exist.
                // If we want global search, we ignore onSearch? 
                // Let's support both: On Enter, if onSearch is defined, maybe we still route?
                // Actually, let's just route if it's a global search intent.
            } else {
                router.push(`/?search=${encodeURIComponent(searchTerm.trim())}`);
            }
        }
    };

    const isSearchVisible = isExpanded || searchTerm;

    // Auto-detect Back Arrow mode if not explicitly disabled
    const shouldShowBackArrow = showBackArrow ||
        pathname.startsWith('/movie/') ||
        pathname.startsWith('/person/') ||
        pathname.startsWith('/watch/') ||
        (pathname.startsWith('/articles/') && pathname !== '/articles');

    return (
        <nav className="navbar">
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <div className="container navbar-container">
                <div className="navbar-left">

                    {/* Hamburger Menu (Mobile Only) */}
                    {!shouldShowBackArrow && (
                        <div
                            className="mobile-menu-trigger mobile-menu-trigger-btn"
                            onClick={() => setIsMenuOpen(true)}
                            role="button"
                            aria-label="Toggle navigation menu"
                            aria-expanded={isMenuOpen}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsMenuOpen(true); }}
                        >
                            <Menu size={24} />
                        </div>
                    )}

                    {shouldShowBackArrow ? (
                        <div
                            onClick={() => {
                                // Smart Back Logic:
                                // If history has more than 1 entry, go back.
                                // Otherwise (direct entry), go to Home.
                                if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
                                    router.back();
                                } else {
                                    router.push('/');
                                }
                            }}
                            onMouseEnter={() => setIsBackHovered(true)}
                            onMouseLeave={() => setIsBackHovered(false)}
                            role="button"
                            aria-label="Go back"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
                                        router.back();
                                    } else {
                                        router.push('/');
                                    }
                                }
                            }}
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'opacity 0.2s',
                                opacity: isBackHovered ? 1 : (isScrolled ? 0.25 : 1)
                            }}
                        >
                            <ArrowLeft color="white" size={24} />
                        </div>
                    ) : (
                        <Link
                            href="/"
                            className="navbar-logo-link"
                        >
                            <Logo suffix={pathname === '/articles' ? 'Read' : undefined} />
                            {settings.siteName !== 'Filmospere' && (
                                <span className="navbar-site-name">
                                    {settings.siteName}
                                </span>
                            )}
                        </Link>
                    )}
                </div>

                <div className="navbar-right">
                    {/* Desktop Menu Links (Hidden on Mobile) */}
                    <div className="nav-links desktop-only">
                        <Link
                            href="/"
                            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/articles"
                            className={`nav-link ${pathname.includes('articles') ? 'active' : ''}`}
                        >
                            Articles
                        </Link>
                        <Link
                            href="/section/web-series"
                            className={`nav-link ${pathname.includes('web-series') ? 'active' : ''}`}
                        >
                            Series
                        </Link>
                        <Link
                            href="/section/trending"
                            className={`nav-link ${pathname.includes('trending') ? 'active' : ''}`}
                        >
                            Trending
                        </Link>
                    </div>

                    <div className={`navbar-search-container ${isSearchVisible ? 'navbar-search-expanded' : 'navbar-search-collapsed'}`}>
                        <div
                            className="search-trigger"
                            onClick={() => {
                                setIsExpanded(true);
                                setTimeout(() => inputRef.current?.focus(), 100);
                            }}
                            role="button"
                            aria-label="Open search"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setIsExpanded(true); setTimeout(() => inputRef.current?.focus(), 100); } }}
                        >
                            <Search size={20} />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search movies..."
                            value={searchTerm}
                            onChange={handleSearch}
                            onKeyDown={handleKeyDown}
                            onBlur={() => {
                                if (!searchTerm) {
                                    setIsExpanded(false);
                                }
                            }}
                            name="search"
                            id="navbar-search"
                            aria-label="Search movies"
                            className={`search-input ${isSearchVisible ? 'visible' : ''}`}
                        />
                        {/* Close/Clear Icon for Search (Mobile mostly) */}
                        {isSearchVisible && (
                            <div
                                className="search-close-btn"
                                onClick={() => {
                                    ignoreParamsSync.current = true; // Prevent useEffect from reverting this immediately
                                    setSearchTerm('');
                                    if (onSearch) {
                                        onSearch('');
                                    } else {
                                        router.replace('/', { scroll: false });
                                    }
                                    setIsExpanded(false);
                                }}
                                role="button"
                                aria-label="Clear search"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        ignoreParamsSync.current = true;
                                        setSearchTerm('');
                                        if (onSearch) { onSearch(''); } else { router.replace('/', { scroll: false }); }
                                        setIsExpanded(false);
                                    }
                                }}
                            >
                                <X size={16} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
