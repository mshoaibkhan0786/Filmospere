import React from 'react';
import MovieCardSkeleton from './MovieCardSkeleton';

const SectionSkeleton: React.FC = () => {
    return (
        <div style={{ backgroundColor: '#141414', minHeight: '100vh', paddingBottom: '2rem' }}>
            {/* Navbar Placeholder */}
            <div style={{ height: '60px', borderBottom: '1px solid #333', marginBottom: '2rem' }} />

            <div style={{ padding: '0 4%', maxWidth: '1400px', margin: '0 auto' }}>

                {/* Section Header Skeleton */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        height: '40px',
                        width: '200px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        marginBottom: '1rem'
                    }} />
                    <div style={{
                        height: '20px',
                        width: '300px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '4px'
                    }} />
                </div>

                {/* Genre Filter Buttons Skeleton */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto' }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{
                            height: '36px',
                            width: '80px',
                            borderRadius: '50px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            flexShrink: 0
                        }} />
                    ))}
                </div>

                {/* Movie Grid Skeleton */}
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
        </div>
    );
};

export default SectionSkeleton;
