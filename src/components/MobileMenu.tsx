"use client";

import React, { useEffect } from 'react';
import { X, ChevronRight, Home, Tv, Film, TrendingUp, FileText } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const pathname = usePathname();

    // Close on route change
    useEffect(() => {
        if (isOpen) {
            onClose();
        }
    }, [pathname]);

    const menuItems = [
        { label: 'Home', icon: Home, path: '/' },
        { label: 'Articles', icon: FileText, path: '/articles' },
        { label: 'Movies', icon: Film, path: '/section/Latest%20Movies%20%26%20Series' },
        { label: 'TV Series', icon: Tv, path: '/section/web-series' },
        { label: 'Trending', icon: TrendingUp, path: '/section/Trending' },
    ];

    const genres = [
        'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 'Thriller', 'Animation'
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            zIndex: 1000,
            // Ensure interactions are disabled when closed, but transitions still run
            pointerEvents: isOpen ? 'auto' : 'none',
            visibility: isOpen ? 'visible' : 'hidden', // Helper to fully hide after transition
            // When opening: transition immediately (step-start)
            // When closing: delay hidden state (step-end) to allow animations to finish
            transition: `visibility 0.3s ${isOpen ? 'step-start' : 'step-end'}`,
            display: 'flex',
            justifyContent: 'flex-start'
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Drawer Content */}
            <div style={{
                width: '85%',
                maxWidth: '400px',
                height: '100%',
                background: '#1a1a1a', // Fallback
                backgroundColor: 'rgba(20, 20, 20, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRight: '1px solid rgba(255,255,255,0.1)', // CHANGED: Border on RIGHT
                position: 'relative',
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', // Smooth sliding
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '10px 0 30px rgba(0,0,0,0.5)', // CHANGED: Shadow to RIGHT
                zIndex: 1001,
                visibility: 'visible', // Always visible to its parent container (which handles main visibility)
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <Logo />
                    <button
                        onClick={onClose}
                        aria-label="Close navigation menu"
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem'
                }}>
                    {/* Main Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.path || (item.path !== '/' && pathname.includes(item.path));

                            return (
                                <Link
                                    key={item.label}
                                    href={item.path}
                                    onClick={onClose}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        backgroundColor: isActive ? 'rgba(229, 9, 20, 0.1)' : 'transparent',
                                        color: isActive ? '#e50914' : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textDecoration: 'none' // Essential for Link to look like div
                                    }}
                                >
                                    <Icon size={20} color={isActive ? '#e50914' : '#888'} />
                                    <span style={{ fontSize: '1.1rem', fontWeight: isActive ? '600' : '500' }}>{item.label}</span>
                                    {isActive && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e50914' }} />}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Genres Section */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            color: '#666',
                            marginBottom: '1rem',
                            paddingLeft: '0.5rem'
                        }}>
                            Browse Genres
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.8rem'
                        }}>
                            {genres.map(genre => (
                                <Link
                                    key={genre}
                                    href={`/section/${genre}`}
                                    onClick={onClose}
                                    style={{
                                        padding: '0.8rem 1rem',
                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                        borderRadius: '8px',
                                        color: '#ccc',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        textAlign: 'center',
                                        textDecoration: 'none',
                                        display: 'block' // Ensure it fills the grid cell like a div
                                    }}
                                >
                                    {genre}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Footer / Legal */}
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div
                            onClick={() => router.push('/about')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontSize: '0.9rem', cursor: 'pointer', padding: '0.5rem' }}
                        >
                            About Filmospere <ChevronRight size={16} />
                        </div>
                        <div
                            onClick={() => router.push('/contact')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontSize: '0.9rem', cursor: 'pointer', padding: '0.5rem' }}
                        >
                            Contact Us <ChevronRight size={16} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;
