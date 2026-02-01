"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Footer: React.FC = () => {
    const pathname = usePathname();

    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <footer style={{
            background: '#000',
            color: '#444',
            padding: '4rem 2rem',
            marginTop: 'auto',
            borderTop: '1px solid #111',
            fontSize: '0.85rem'
        }}>
            <div className="grid-container" style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '3rem',
                justifyContent: 'center'
            }}>
                {/* Column 1: Discover */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Discover</h4>
                    <Link href="/section/action" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Action</Link>
                    <Link href="/section/comedy" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Comedy</Link>
                    <Link href="/section/horror" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Horror</Link>
                    <Link href="/section/science-fiction" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Science Fiction</Link>
                    <Link href="/section/thriller" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Thriller</Link>
                    <Link href="/section/romance" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Romance</Link>
                </div>

                {/* Column 2: Browse */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Browse</h4>
                    <Link href="/section/trending" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Most Popular</Link>
                    <Link href="/section/top-rated" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Top Rated</Link>
                    <Link href="/section/new-releases" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">New Releases</Link>
                    <Link href="/section/web-series" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">TV Series</Link>
                </div>

                {/* Column 3: Reads */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Reads</h4>
                    <Link href="/articles/decoding-the-fifth-dimension-the-real-meaning-of-interstellar-s-ending" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Interstellar Explained</Link>
                    <Link href="/articles/why-the-top-wobbles-the-definitive-inception-theory" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Inception Theory</Link>
                    <Link href="/articles/shutter-island-ending-explained" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Shutter Island</Link>
                    <Link href="/articles/what-lies-beneath-the-house-unraveling-parasite-s-final-twist" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Parasite Explained</Link>
                    <Link href="/articles/why-borden-s-sacrifice-redefines-the-prestige-a-definitive-analysis" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">The Prestige Analysis</Link>
                    <Link href="/articles/joker-s-final-laugh-the-true-meaning-behind-the-chaos" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Joker Ending</Link>
                    <Link href="/articles/why-oh-dae-su-s-silence-speaks-volumes-the-definitive-oldboy-ending-theory" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Oldboy Theory</Link>
                    <Link href="/articles/why-amy-s-return-redefines-the-marriage-in-gone-girl" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Gone Girl Analysis</Link>
                </div>

                {/* Column 3: Legal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Legal</h4>
                    <Link href="/about" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">About & Credits</Link>
                    <Link href="/privacy" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Privacy Policy</Link>
                    <Link href="/terms" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Terms of Service</Link>
                    <Link href="/contact" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Contact Us</Link>
                </div>
            </div>

            <div style={{
                textAlign: 'center',
                marginTop: '4rem',
                paddingTop: '2rem',
                borderTop: '1px solid #111',
                color: '#333'
            }}>
                <p>&copy; {new Date().getFullYear()} Filmospere. All rights reserved.</p>
            </div>

            <style jsx>{`
                .footer-link:hover {
                    color: #999 !important;
                }
                @media (max-width: 768px) {
                    footer .grid-container {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
            `}</style>
        </footer>
    );
};

export default Footer;
