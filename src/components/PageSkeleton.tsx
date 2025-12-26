import React from 'react';
import MovieCardSkeleton from './MovieCardSkeleton';
import HeroSkeleton from './HeroSkeleton';

const PageSkeleton: React.FC = () => {
    return (
        <div style={{ backgroundColor: '#141414', minHeight: '100vh', paddingBottom: '2rem' }}>
            {/* Navbar Placeholder */}
            <div style={{ height: '60px', borderBottom: '1px solid #333', marginBottom: '0' }} />

            {/* Hero Skeleton (Matches FeaturedHero) */}
            <HeroSkeleton />

            {/* Movie Grid Skeleton */}
            <div style={{ padding: '0 4%', maxWidth: '1400px', margin: '2rem auto 0' }}>


                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '2rem'
                }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} style={{ width: '100%' }}>
                            <MovieCardSkeleton />
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

export default PageSkeleton;
