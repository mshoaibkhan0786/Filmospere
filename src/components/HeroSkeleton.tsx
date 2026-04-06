import React from 'react';

const HeroSkeleton: React.FC = () => {
    return (
        <div className="hero-skeleton">
            <div className="skeleton-backdrop" />
            {/* Content Placeholder */}
            <div className="skeleton-content container">
                {/* Metadata Line */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ height: '1.2rem', width: '60px', background: '#333', borderRadius: '4px' }} />
                    <div style={{ height: '1.2rem', width: '80px', background: '#333', borderRadius: '4px' }} />
                    <div style={{ height: '1.2rem', width: '60px', background: '#333', borderRadius: '4px' }} />
                </div>

                {/* Title */}
                <div className="skeleton-title" />

                {/* Description */}
                <div style={{ height: '1rem', width: '40%', background: '#333', marginBottom: '0.5rem', borderRadius: '4px' }} />
                <div style={{ height: '1rem', width: '35%', background: '#333', marginBottom: '2rem', borderRadius: '4px' }} />

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="skeleton-btn" />
                    <div className="skeleton-btn" />
                </div>
            </div>
        </div>
    );
};

export default HeroSkeleton;
