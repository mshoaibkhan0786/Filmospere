import React from 'react';
import MovieCardSkeleton from '../../../components/MovieCardSkeleton';

export default function Loading() {
    return (
        <>
            <div>
                {/* Tag Skeletons */}
                <div style={{
                    display: 'flex',
                    gap: '0.8rem',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem',
                    marginBottom: '2rem',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="skeleton-shimmer"
                            style={{
                                width: '100px', // STRICT FIXED WIDTH - NO CALCULATIONS
                                height: '36px',
                                borderRadius: '50px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                flexShrink: 0,
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        />
                    ))}
                </div>

                {/* Grid Skeleton Only - Header is in Layout */}
                <div className="cols-6-grid">
                    {[...Array(18)].map((_, i) => (
                        <MovieCardSkeleton key={i} />
                    ))}
                </div>
            </div>
            <style>{`
                .skeleton-shimmer {
                    position: relative;
                    overflow: hidden;
                }
                .skeleton-shimmer::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0,
                        rgba(255, 255, 255, 0.05) 20%,
                        rgba(255, 255, 255, 0.1) 60%,
                        rgba(255, 255, 255, 0)
                    );
                    animation: shimmer 2s infinite;
                }
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </>
    );
}
