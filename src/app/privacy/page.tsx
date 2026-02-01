import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PageBackButton from '@/components/PageBackButton';

export const metadata: Metadata = {
    title: 'Privacy Policy - Filmospere',
    description: 'Filmospere\'s Privacy Policy explains how we collect, use, and protect your data.',
    alternates: {
        canonical: 'https://filmospere.com/privacy'
    }
};

export default function PrivacyPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', padding: '100px 2rem 2rem' }}>
            <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <PageBackButton />
                </div>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', borderBottom: '3px solid #e50914', paddingBottom: '0.5rem' }}>Privacy Policy</h1>
                <p style={{ color: '#888', marginBottom: '2rem' }}>Last Updated: December 18, 2025</p>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>1. Information We Collect</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        Filmospere collects minimal data to provide our service. We use localStorage to store your viewing preferences (genre interests, language preferences) entirely on your device. No personal information is sent to our servers.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>2. Third-Party Services</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        We use the following third-party services:
                    </p>
                    <ul style={{ lineHeight: '1.8', color: '#ccc', paddingLeft: '2rem' }}>
                        <li><strong>TMDB (The Movie Database):</strong> For movie metadata and images. See <a href="https://www.themoviedb.org/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#e50914' }}>TMDB Privacy Policy</a></li>
                        <li><strong>Supabase:</strong> For database hosting. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#e50914' }}>Supabase Privacy Policy</a></li>
                        <li><strong>wsrv.nl:</strong> For image optimization. No personal data is collected.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>3. Cookies</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        We use browser localStorage (not cookies) to remember your preferences. This data never leaves your device and can be cleared anytime through your browser settings.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>4. Data Security</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        Your browsing activity on Filmospere is not tracked or stored by us. We implement industry-standard security measures to protect our infrastructure.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>5. Your Rights</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        You have the right to:
                    </p>
                    <ul style={{ lineHeight: '1.8', color: '#ccc', paddingLeft: '2rem' }}>
                        <li>Clear your local preferences at any time</li>
                        <li>Request information about data we store (which is minimal)</li>
                        <li>Contact us about privacy concerns</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>6. Changes to This Policy</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        We may update this Privacy Policy from time to time. The "Last Updated" date will reflect any changes.
                    </p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>7. Contact Us</h2>
                    <p style={{ lineHeight: '1.8', color: '#ccc' }}>
                        If you have questions about this Privacy Policy, please visit our <Link href="/contact" style={{ color: '#e50914' }}>Contact Page</Link>.
                    </p>
                </section>
            </div>
        </div>
    );
}
