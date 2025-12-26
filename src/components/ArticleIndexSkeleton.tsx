
import React from 'react';

const ArticleIndexSkeleton: React.FC = () => {
    return (
        <div className="container" style={{ padding: '80px 20px 40px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#141414' }}>
            {/* Simple Navbar Placeholder if needed, but App skeleton usually handles full page. 
                 Since this is inner content, we focus on the content. */}

            {/* Shimmer Style */}
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
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
                    animation: shimmer 1.5s infinite;
                }
                .skeleton-box {
                    background-color: #1f1f1f;
                    border-radius: 16px;
                    position: relative;
                    overflow: hidden;
                }
            `}</style>

            {/* Hero Article Skeleton */}
            <div className="skeleton-box" style={{
                height: '500px',
                width: '100%',
                marginBottom: '3rem',
            }}>
                <div className="skeleton-shimmer" />
            </div>

            {/* Recent Stories Title Skeleton */}
            <div className="skeleton-box" style={{
                width: '200px',
                height: '30px',
                marginBottom: '1.5rem',
                borderRadius: '4px'
            }}>
                <div className="skeleton-shimmer" />
            </div>

            {/* Grid Skeletons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="skeleton-box" style={{ height: '350px' }}>
                        <div className="skeleton-shimmer" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArticleIndexSkeleton;
