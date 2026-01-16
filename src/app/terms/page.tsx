import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service - Filmospere',
    description: 'Terms of Service for using Filmospere\'s movie discovery platform.',
};

export default function TermsPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', padding: '100px 2rem 2rem' }}>
            <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none', marginBottom: '2rem' }}>
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', borderBottom: '3px solid #e50914', paddingBottom: '0.5rem' }}>Terms of Service</h1>
                <p style={{ color: '#888', marginBottom: '2rem' }}>Last Updated: December 18, 2024</p>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>1. Acceptance of Terms</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        By accessing and using Filmospere, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our service.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>2. Service Description</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        Filmospere is a movie discovery platform that aggregates information from public APIs (primarily TMDB). We provide:
                    </p>
                    <ul style={{ lineHeight: '1.8', color: '#ccc', paddingLeft: '2rem' }}>
                        <li>Movie and TV series information</li>
                        <li>Links to legal streaming services</li>
                        <li>Recommendations and discovery features</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>3. Acceptable Use</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        You agree not to:
                    </p>
                    <ul style={{ lineHeight: '1.8', color: '#ccc', paddingLeft: '2rem' }}>
                        <li>Use automated tools to scrape or download content</li>
                        <li>Attempt to access admin areas without authorization</li>
                        <li>Distribute malware or harmful code</li>
                        <li>Violate any applicable laws or regulations</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>4. Content Policy</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        <strong>We do not host any content.</strong> All movie data and images are sourced from TMDB. Streaming links direct to legal, licensed platforms only. We do not provide or support piracy or adult (18+) content.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>5. Intellectual Property</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        Movie metadata, images, and descriptions are provided by TMDB and are subject to their terms. The Filmospere website design and code are proprietary.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>6. Disclaimer of Warranties</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        Filmospere is provided "as is" without warranties of any kind. We do not guarantee accuracy of information or availability of streaming links.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>7. Limitation of Liability</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        Filmospere shall not be liable for any damages arising from use of the service, including data loss or service interruptions.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>8. Changes to Terms</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of changes.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>9. Contact</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        For questions about these Terms of Service, visit our <Link href="/contact" style={{ color: '#e50914' }}>Contact Page</Link>.
                    </p>
                </section>
            </div>
        </div>
    );
}
