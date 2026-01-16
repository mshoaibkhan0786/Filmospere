
import React from 'react';

const ArticleSkeleton: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white' }}>
            <div style={{
                width: '100%',
                height: '60vh',
                maxHeight: '600px',
                backgroundColor: '#222',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="skeleton-shimmer" />
            </div>

            <div className="container" style={{ padding: '3rem 20px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ height: '3rem', width: '80%', backgroundColor: '#222', marginBottom: '2rem', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                    <div className="skeleton-shimmer" />
                </div>

                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} style={{
                        height: '1rem',
                        width: '100%',
                        backgroundColor: '#222',
                        marginBottom: '1rem',
                        borderRadius: '4px',
                        position: 'relative',
                        overflow: 'hidden',
                        opacity: 0.7
                    }}>
                        <div className="skeleton-shimmer" />
                    </div>
                ))}
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

export default ArticleSkeleton;
