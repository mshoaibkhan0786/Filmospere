'use client';

import React, { useState } from 'react';
import { Share2, Twitter, Facebook, Link as LinkIcon, Check } from 'lucide-react';

interface ShareButtonsProps {
    title: string;
    url?: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ title, url }) => {
    const [copied, setCopied] = useState(false);

    // Fallback to window.location.href if url not provided (client-side only)
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    const handleFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #333' }}>
            <span style={{ color: '#888', marginRight: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>Share</span>

            <button
                onClick={handleTwitter}
                title="Share on Twitter"
                style={{
                    background: '#1DA1F2',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <Twitter size={18} />
            </button>

            <button
                onClick={handleFacebook}
                title="Share on Facebook"
                style={{
                    background: '#4267B2',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <Facebook size={18} />
            </button>

            <button
                onClick={handleCopy}
                title="Copy Link"
                style={{
                    background: copied ? '#22c55e' : '#333',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => !copied && (e.currentTarget.style.background = '#444')}
                onMouseLeave={e => !copied && (e.currentTarget.style.background = '#333')}
            >
                {copied ? <Check size={18} /> : <LinkIcon size={18} />}
            </button>
        </div>
    );
};

export default ShareButtons;
