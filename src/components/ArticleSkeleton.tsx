
import React from 'react';

const ArticleSkeleton: React.FC = () => {
    return (
        <div style={{ backgroundColor: '#141414', minHeight: '100vh', paddingBottom: '2rem' }}>
            {/* Navbar Placeholder */}
            <div style={{ height: '60px', borderBottom: '1px solid #333', marginBottom: '0' }} />

            {/* Hero Skeleton */}
            <div style={{
                width: '100%',
                height: '60vh',
                maxHeight: '600px',
                backgroundColor: '#1f1f1f',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                    animation: 'shimmer 1.5s infinite'
                }} />
            </div>

            {/* Content Body Skeleton */}
            <div className="container" style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '3rem 20px 6rem'
            }}>
                {/* Title/Subtitle Placeholder */}
                <div style={{
                    height: '40px',
                    width: '80%',
                    backgroundColor: '#1f1f1f',
                    marginBottom: '2rem',
                    borderRadius: '4px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                        animation: 'shimmer 1.5s infinite'
                    }} />
                </div>

                {/* Text Paragraphs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} style={{
                            height: '16px',
                            width: i % 2 === 0 ? '100%' : '90%',
                            backgroundColor: '#1f1f1f',
                            borderRadius: '4px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                                animation: 'shimmer 1.5s infinite'
                            }} />
                        </div>
                    ))}
                </div>

                {/* Second Paragraph Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{
                            height: '16px',
                            width: i % 3 === 0 ? '95%' : '100%',
                            backgroundColor: '#1f1f1f',
                            borderRadius: '4px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                                animation: 'shimmer 1.5s infinite'
                            }} />
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default ArticleSkeleton;
