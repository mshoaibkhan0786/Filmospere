import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const About: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', padding: '2rem' }}>
            <Helmet>
                <title>About & Credits - Filmospere</title>
                <meta name="description" content="Learn about Filmospere, our data sources including TMDB, and our content policy." />
            </Helmet>

            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none', marginBottom: '2rem' }}>
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', borderBottom: '3px solid #e50914', paddingBottom: '0.5rem' }}>About & Credits</h1>

                <section style={{ marginBottom: '3rem' }}>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#ccc' }}>
                        Filmospere is a comprehensive movie and series discovery platform that helps you find what to watch next. We aggregate information from trusted sources to provide detailed content information and streaming availability.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#e50914' }}>Data Sources</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* TMDB */}
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', padding: '1.5rem', backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
                            <img
                                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
                                alt="TMDB Logo"
                                style={{ width: '60px', flexShrink: 0, borderRadius: '8px' }}
                            />
                            <div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>The Movie Database (TMDB)</h3>
                                <p style={{ color: '#aaa', lineHeight: '1.6' }}>
                                    This product uses the TMDB API but is not endorsed or certified by TMDB. TMDB provides comprehensive movie and TV series metadata, including cast information, ratings, descriptions, and images.
                                </p>
                            </div>
                        </div>

                        {/* Wikipedia */}
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', padding: '1.5rem', backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png"
                                alt="Wikipedia Logo"
                                style={{ width: '50px', flexShrink: 0 }}
                            />
                            <div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>Wikipedia & Wikimedia</h3>
                                <p style={{ color: '#aaa', lineHeight: '1.6' }}>
                                    Additional biographical data and images are sourced from Wikipedia and Wikimedia Commons under their respective licenses.
                                </p>
                            </div>
                        </div>

                        {/* JustWatch */}
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', padding: '1.5rem', backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
                            <img
                                src="/just_watchicon.png"
                                alt="JustWatch Logo"
                                style={{ width: '50px', flexShrink: 0, borderRadius: '8px' }}
                            />
                            <div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>JustWatch</h3>
                                <p style={{ color: '#aaa', lineHeight: '1.6' }}>
                                    Streaming availability data is powered by JustWatch. This enables our "Where to Watch" feature showing legal streaming options across Netflix, Prime Video, Apple TV, and more.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>Content Policy</h2>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                        <p style={{ color: '#ccc', lineHeight: '1.8', marginBottom: '1rem' }}>
                            Filmospere is a <strong>legal movie discovery platform</strong>. We are committed to:
                        </p>
                        <ul style={{ color: '#aaa', lineHeight: '1.8', paddingLeft: '2rem' }}>
                            <li>Not hosting any pirated or illegal content</li>
                            <li>Not displaying adult (18+) material</li>
                            <li>Only linking to licensed streaming services (Netflix, Prime Video, Apple TV, etc.)</li>
                            <li>Respecting copyright and intellectual property rights</li>
                        </ul>
                    </div>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#e50914' }}>Technology</h2>
                    <p style={{ color: '#ccc', lineHeight: '1.8' }}>
                        Built with modern web technologies including React 19, TypeScript, Vite, and Supabase for a fast, responsive user experience.
                    </p>
                </section>

                <footer style={{
                    marginTop: '4rem',
                    paddingTop: '2rem',
                    borderTop: '1px solid #333',
                    color: '#666',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                }}>
                    &copy; {new Date().getFullYear()} Filmospere. All rights reserved.
                </footer>
            </div>
        </div>
    );
};

export default About;
