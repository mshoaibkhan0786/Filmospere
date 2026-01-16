"use client";

import React from 'react';
import { Plus, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import type { Movie, StreamingLink } from '../../types';

interface EditorStreamingProps {
    formData: Partial<Movie>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Movie>>>;
    pendingLink: StreamingLink;
    setPendingLink: React.Dispatch<React.SetStateAction<StreamingLink>>;
}

const POPULAR_PLATFORMS = [
    'Netflix',
    'Amazon Prime Video',
    'Disney+',
    'Hotstar',
    'Hulu',
    'HBO Max',
    'Apple TV+',
    'SonyLIV',
    'Zee5',
    'JioCinema',
    'YouTube Premium',
    'Google Play Movies'
];

const EditorStreaming: React.FC<EditorStreamingProps> = ({ formData, setFormData, pendingLink, setPendingLink }) => {
    // Removed local state, using props now

    const handleAddLink = () => {
        if (!pendingLink.platform) return;

        setFormData(prev => ({
            ...prev,
            streamingLinks: [...(prev.streamingLinks || []), pendingLink]
        }));

        setPendingLink({ platform: '', url: '' });
    };

    const removeLink = (index: number) => {
        setFormData(prev => ({
            ...prev,
            streamingLinks: prev.streamingLinks?.filter((_, i) => i !== index) || []
        }));
    };

    return (
        <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LinkIcon size={20} />
                OTT & Streaming Links
            </h3>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Add New Link */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr auto',
                    gap: '2rem',
                    alignItems: 'end',
                    backgroundColor: '#222',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    marginBottom: formData.streamingLinks?.length ? '2rem' : '0' // Add spacing only if there are items below
                }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Platform</label>
                        <input
                            list="platforms"
                            type="text"
                            value={pendingLink.platform}
                            onChange={e => setPendingLink({ ...pendingLink, platform: e.target.value })}
                            placeholder="e.g. Netflix"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white' }}
                        />
                        <datalist id="platforms">
                            {POPULAR_PLATFORMS.map(p => (
                                <option key={p} value={p} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Watch URL <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>(Optional)</span></label>
                        <input
                            type="url"
                            value={pendingLink.url}
                            onChange={e => setPendingLink({ ...pendingLink, url: e.target.value })}
                            placeholder="https://..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white' }}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleAddLink}
                        disabled={!pendingLink.platform}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: (!pendingLink.platform) ? '#444' : 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: (!pendingLink.platform) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 'bold',
                            height: '42px' // Match input height roughly
                        }}
                    >
                        <Plus size={18} /> Add
                    </button>
                </div>
                {/* Warning for unsaved input */}
                {pendingLink.platform && (
                    <div style={{ color: '#e5b109', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '-0.5rem', paddingLeft: '0.5rem' }}>
                        <span>⚠️ Don't forget to click "Add" to save this link!</span>
                    </div>
                )}

                {/* List Existing Links */}
                {formData.streamingLinks && formData.streamingLinks.length > 0 && (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {formData.streamingLinks.map((link, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#222',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid #333'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#333',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        color: '#888'
                                    }}>
                                        {link.platform.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{link.platform}</div>
                                        {link.url ? (
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ fontSize: '0.85rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                {link.url} <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                                                No URL provided
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeLink(index)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ff4444',
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        borderRadius: '50%',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorStreaming;
