
import React from 'react';

const ArticleIndexSkeleton: React.FC = () => {
    return (
        <div style={{ width: '100%' }}>
            {/* Hero Skeleton */}
            <div style={{
                height: '500px',
                width: '100%',
                backgroundColor: '#222',
                borderRadius: '24px',
                marginBottom: '3rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="skeleton-shimmer" />
            </div>

            {/* Grid Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} style={{
                        height: '400px',
                        backgroundColor: '#222',
                        borderRadius: '16px',
                        position: 'relative',
                        overflow: 'hidden'
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

export default ArticleIndexSkeleton;
