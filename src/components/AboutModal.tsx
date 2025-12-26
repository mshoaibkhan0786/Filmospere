import React from 'react';
import { X } from 'lucide-react';

interface AboutModalProps {
    onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
    return (
        <div
            className="fade-in"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                zIndex: 2000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '12px',
                    padding: '2rem',
                    maxWidth: '500px',
                    width: '100%',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>About</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ccc',
                            cursor: 'pointer',
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ color: '#ccc', lineHeight: '1.6' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        This website provides information about movies and series from various sources.
                    </p>

                    <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '0.5rem' }}>Data Sources</h3>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <img
                                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
                                alt="TMDB Logo"
                                style={{ width: '40px', marginTop: '5px' }}
                            />
                            <div>
                                <strong>The Movie Database (TMDB)</strong><br />
                                <p className="text-gray-300">
                                    This product uses the TMDB API but is not endorsed or certified by TMDB.
                                </p>
                            </div>
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png"
                                alt="Wikipedia Logo"
                                style={{ width: '30px', margin: '5px' }}
                            />
                            <div>
                                <strong>Wikipedia & Wikimedia</strong><br />
                                <span style={{ fontSize: '0.9rem', color: '#999' }}>
                                    Additional data and images provided by Wikipedia and Wikimedia Commons.
                                </span>
                            </div>
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <img
                                src="/just_watchicon.png"
                                alt="JustWatch Logo"
                                style={{ width: '30px', margin: '5px', borderRadius: '4px' }}
                            />
                            <div>
                                <strong>JustWatch</strong><br />
                                <span style={{ fontSize: '0.9rem', color: '#999' }}>
                                    Streaming data powered by JustWatch. Creates the "Where to Watch" availability.
                                </span>
                            </div>
                        </li>
                    </ul>

                    <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '0.5rem' }}>Content Policy</h3>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                        Filmospere is a movie discovery platform. We do <strong>not</strong> host any piracy content or adult (18+) material. All "Where to Watch" links direct to legal, licensed streaming services (like Netflix, Prime Video, Apple TV, etc.).
                    </p>

                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                        &copy; {new Date().getFullYear()} Filmospere. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;
