import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowLeft, Menu, X } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import Logo from './Logo';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MobileMenu from './MobileMenu';

import './Navbar.css';

interface NavbarProps {
    onSearch: (query: string) => void;
    showBackArrow?: boolean;
    initialSearchTerm?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, showBackArrow = false, initialSearchTerm = '' }) => {
    const { settings } = useConfig();
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isBackHovered, setIsBackHovered] = useState(false);

    useEffect(() => {
        if (initialSearchTerm) {
            setIsExpanded(true);
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.setSelectionRange(initialSearchTerm.length, initialSearchTerm.length);
                }
            }, 100);
        }
    }, []); // Only run on mount to restore focus after navigation

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        onSearch(value);
    };

    const isSearchVisible = isExpanded || searchTerm;

    return (
        <nav className="navbar">
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <div className="container navbar-container">
                <div className="navbar-left">

                    {/* Hamburger Menu (Mobile Only) */}
                    {!showBackArrow && (
                        <div
                            className="mobile-menu-trigger mobile-menu-trigger-btn"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </div>
                    )}

                    {showBackArrow ? (
                        <div
                            className="back-arrow-btn"
                            onClick={() => navigate(-1)}
                            onMouseEnter={() => setIsBackHovered(true)}
                            onMouseLeave={() => setIsBackHovered(false)}
                            style={{
                                opacity: isBackHovered ? 1 : (isScrolled ? 0.25 : 1)
                            }}
                        >
                            <ArrowLeft color="white" size={24} />
                        </div>
                    ) : (
                        <Link
                            to="/"
                            className="navbar-logo-link"
                        >
                            <Logo suffix={location.pathname === '/articles' ? 'Read' : undefined} />
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
                            to="/"
                            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/articles"
                            className={`nav-link ${location.pathname.includes('articles') ? 'active' : ''}`}
                        >
                            Articles
                        </Link>
                        <Link
                            to="/section/Web%20Series"
                            className={`nav-link ${location.pathname.includes('Web Series') ? 'active' : ''}`}
                        >
                            Series
                        </Link>
                        <Link
                            to="/section/Trending"
                            className={`nav-link ${location.pathname.includes('Trending') ? 'active' : ''}`}
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
                        >
                            <Search size={20} />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search movies..."
                            value={searchTerm}
                            onChange={handleSearch}
                            onBlur={() => {
                                if (!searchTerm) {
                                    setIsExpanded(false);
                                }
                            }}
                            name="search"
                            id="navbar-search"
                            className={`search-input ${isSearchVisible ? 'visible' : ''}`}
                        />
                        {/* Close/Clear Icon for Search (Mobile mostly) */}
                        {isSearchVisible && (
                            <div
                                className="search-close-btn"
                                onClick={() => {
                                    setSearchTerm('');
                                    onSearch('');
                                    setIsExpanded(false);
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
