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
            padding: '2rem 0',
            marginTop: 'auto',
            background: 'transparent',
            color: '#666',
            fontSize: '0.9rem',
            textAlign: 'center'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                flexWrap: 'wrap',
                marginBottom: '0.5rem'
            }}>
                <Link
                    href="/about"
                    style={{
                        color: '#444',
                        textDecoration: 'none',
                        padding: '0.5rem',
                        transition: 'color 0.2s'
                    }}
                >
                    About & Credits
                </Link>

                <Link
                    href="/privacy"
                    style={{
                        color: '#444',
                        textDecoration: 'none',
                        padding: '0.5rem',
                        transition: 'color 0.2s'
                    }}
                >
                    Privacy Policy
                </Link>

                <Link
                    href="/terms"
                    style={{
                        color: '#444',
                        textDecoration: 'none',
                        padding: '0.5rem',
                        transition: 'color 0.2s'
                    }}
                >
                    Terms of Service
                </Link>

                <Link
                    href="/contact"
                    style={{
                        color: '#444',
                        textDecoration: 'none',
                        padding: '0.5rem',
                        transition: 'color 0.2s'
                    }}
                >
                    Contact
                </Link>
            </div>
        </footer>
    );
};

export default Footer;
