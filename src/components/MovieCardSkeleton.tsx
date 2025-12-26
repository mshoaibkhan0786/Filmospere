import React from 'react';

const MovieCardSkeleton: React.FC = () => {
    return (
        <div
            className="movie-card-skeleton"
            style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                height: '100%'
            }}
        >
            {/* Poster Skeleton */}
            <div style={{
                position: 'relative',
                aspectRatio: '2/3',
                backgroundColor: '#2a2a2a',
                overflow: 'hidden'
            }}>
                <div className="skeleton-shimmer" style={{ width: '100%', height: '100%' }} />
            </div>




        </div>
    );
};

export default MovieCardSkeleton;
