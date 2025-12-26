import React from 'react';

const PersonSkeleton: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white' }}>
            <div className="container actor-hero">
                {/* Image Skeleton */}
                <div className="actor-image-container" style={{ backgroundColor: '#222', position: 'relative', overflow: 'hidden' }}>
                    <div className="skeleton-shimmer" />
                </div>

                {/* Info Skeleton */}
                <div className="actor-info">
                    {/* Name */}
                    <div style={{ height: '3.5rem', width: '60%', minWidth: '200px', backgroundColor: '#222', marginBottom: '1rem', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <div className="skeleton-shimmer" />
                    </div>

                    {/* Known For */}
                    <div style={{ height: '1.5rem', width: '40%', minWidth: '150px', backgroundColor: '#222', marginBottom: '2rem', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <div className="skeleton-shimmer" />
                    </div>

                    {/* Stats Grid */}
                    <div className="actor-stats-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ minWidth: '100px' }}>
                                <div style={{ height: '1rem', width: '80%', backgroundColor: '#222', marginBottom: '0.5rem', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                    <div className="skeleton-shimmer" />
                                </div>
                                <div style={{ height: '1.2rem', width: '60%', backgroundColor: '#222', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                    <div className="skeleton-shimmer" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bio Lines */}
                    <div style={{ marginTop: '2rem', maxWidth: '800px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} style={{
                                height: '1rem',
                                width: i === 5 ? '60%' : '100%',
                                backgroundColor: '#222',
                                marginBottom: '0.8rem',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                position: 'relative',
                                animationDelay: `${i * 0.1}s`
                            }}>
                                <div className="skeleton-shimmer" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .skeleton-shimmer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
};

export default PersonSkeleton;
