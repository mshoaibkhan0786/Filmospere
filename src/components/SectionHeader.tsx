'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    description: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description }) => {
    const router = useRouter();

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
                <h1 className="section-title" style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                    {title}
                </h1>
                {description && (
                    <p style={{ color: '#aaa', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.5', margin: 0 }}>
                        {description}
                    </p>
                )}
            </div>

            <button
                onClick={() => router.back()}
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '10px',
                    borderRadius: '50%',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)',
                    width: '40px',
                    height: '40px',
                    justifyContent: 'center',
                    flexShrink: 0
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                <ArrowLeft size={24} />
            </button>
        </div>
    );
};

export default SectionHeader;
