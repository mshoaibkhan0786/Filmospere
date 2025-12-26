import React from 'react';

const HeroSkeleton: React.FC = () => {
    return (
        <div style={{
            height: '85vh',
            backgroundColor: '#1a1a1a',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '0'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
                animation: 'shimmer 1.5s infinite'
            }} />
            {/* Content Placeholder */}
            <div className="container" style={{ position: 'absolute', bottom: '20%', left: 0, right: 0, paddingLeft: '0' }}>
                {/* Metadata Line */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ height: '1.2rem', width: '60px', background: '#333', borderRadius: '4px' }} />
                    <div style={{ height: '1.2rem', width: '80px', background: '#333', borderRadius: '4px' }} />
                    <div style={{ height: '1.2rem', width: '60px', background: '#333', borderRadius: '4px' }} />
                </div>

                {/* Title */}
                <div style={{ height: '4rem', width: '50%', background: '#333', marginBottom: '1.5rem', borderRadius: '4px' }} />

                {/* Description */}
                <div style={{ height: '1rem', width: '40%', background: '#333', marginBottom: '0.5rem', borderRadius: '4px' }} />
                <div style={{ height: '1rem', width: '35%', background: '#333', marginBottom: '2rem', borderRadius: '4px' }} />

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ height: '3.5rem', width: '140px', background: '#333', borderRadius: '4px' }} />
                    <div style={{ height: '3.5rem', width: '160px', background: '#333', borderRadius: '4px' }} />
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

export default HeroSkeleton;
