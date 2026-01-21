'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const PageBackButton: React.FC = () => {
    const router = useRouter();

    return (
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
                flexShrink: 0,
                marginBottom: '2rem'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Go Back"
        >
            <ArrowLeft size={24} />
        </button>
    );
};

export default PageBackButton;
