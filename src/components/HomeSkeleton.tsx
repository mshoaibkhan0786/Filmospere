import React from 'react';
import HeroSkeleton from './HeroSkeleton';
import MovieCardSkeleton from './MovieCardSkeleton';

const HomeSkeleton: React.FC = () => {
    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <HeroSkeleton />

            <div className="container" style={{
                marginTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '3rem',
                paddingLeft: '4%',
                position: 'relative',
                zIndex: 20
            }}>
                {[1, 2, 3].map((sectionIndex) => (
                    <div key={sectionIndex}>
                        {/* Section Title Skeleton */}
                        <div style={{
                            width: '200px',
                            height: '28px',
                            backgroundColor: '#262626',
                            marginBottom: '1rem',
                            borderRadius: '4px'
                        }} />

                        {/* Horizontal Row */}
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            overflow: 'hidden'
                        }}>
                            {[1, 2, 3, 4, 5, 6].map((cardIndex) => (
                                <div key={cardIndex} style={{ minWidth: '160px', width: '160px' }}>
                                    <MovieCardSkeleton />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomeSkeleton;
