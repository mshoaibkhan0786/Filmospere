"use client";

import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Menu } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import Logo from './Logo';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import MobileMenu from './MobileMenu';

import './Navbar.css';

interface NavbarProps {
    showBackArrow?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ showBackArrow = false }) => {
    const { settings } = useConfig();
    const router = useRouter();
    const pathname = usePathname();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isBackHovered, setIsBackHovered] = useState(false);

    if (pathname.startsWith('/admin')) {
        return null;
    }

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

                    {/* Search Page Navigation Link */}
                    <Link
                        href="/search"
                        className={`nav-link ${pathname === '/search' ? 'active' : ''}`}
                        aria-label="Search"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 8px',
                            color: pathname === '/search' ? '#fff' : '#ccc',
                            transition: 'color 0.2s',
                        }}
                    >
                        <Search size={20} />
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
