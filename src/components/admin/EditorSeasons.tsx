"use client";

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Movie } from '../../types';

interface EditorSeasonsProps {
    formData: Partial<Movie>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Movie>>>;
}

const EditorSeasons: React.FC<EditorSeasonsProps> = ({ formData, setFormData }) => {
    const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());

    // Helper to deeply clone seasons to ensure immutability
    const getSeasonsClone = (currentSeasons: any[]) => {
        return JSON.parse(JSON.stringify(currentSeasons));
    };

    const updateEpisode = (seasonIndex: number, episodeIndex: number, field: string, value: string) => {
        setFormData(prev => {
            const newSeasons = getSeasonsClone(prev.seasons || []);
            if (newSeasons[seasonIndex] && newSeasons[seasonIndex].episodes[episodeIndex]) {
                newSeasons[seasonIndex].episodes[episodeIndex][field] = value;
            }
            return { ...prev, seasons: newSeasons };
        });
    };

    const handleApplySeason = (seasonIndex: number, thumbUrl: string) => {
        setFormData(prev => {
            const newSeasons = getSeasonsClone(prev.seasons || []);
            if (newSeasons[seasonIndex]) {
                newSeasons[seasonIndex].episodes.forEach((ep: any) => {
                    ep.thumbnailUrl = thumbUrl;
                });
            }
            return { ...prev, seasons: newSeasons };
        });
    };

    const handleApplySeries = (thumbUrl: string) => {
        setFormData(prev => {
            const newSeasons = getSeasonsClone(prev.seasons || []);
            newSeasons.forEach((season: any) => {
                season.episodes.forEach((ep: any) => {
                    ep.thumbnailUrl = thumbUrl;
                });
            });
            return { ...prev, seasons: newSeasons };
        });
    };

    return (
        <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Seasons & Episodes</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => {
                            const allIndices = new Set(formData.seasons?.map((_, i) => i) || []);
                            setExpandedSeasons(allIndices);
                        }}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'none', border: '1px solid #555', color: '#ddd', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Expand All
                    </button>
                    <button
                        type="button"
                        onClick={() => setExpandedSeasons(new Set())}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'none', border: '1px solid #555', color: '#ddd', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            <button
                type="button"
                onClick={() => {
                    const newSeason = {
                        seasonNumber: (formData.seasons?.length || 0) + 1,
                        episodes: []
                    };
                    setFormData(prev => ({ ...prev, seasons: [...(prev.seasons || []), newSeason] }));
                    setExpandedSeasons(prev => new Set(prev).add((formData.seasons?.length || 0)));
                }}
                style={{ marginBottom: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '6px', backgroundColor: '#333', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
                + Add Season
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formData.seasons?.map((season, sIdx) => {
                    const isExpanded = expandedSeasons.has(sIdx);
                    return (
                        <div key={sIdx} style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', overflow: 'hidden' }}>
                            {/* Season Header */}
                            <div
                                onClick={() => {
                                    setExpandedSeasons(prev => {
                                        const next = new Set(prev);
                                        if (next.has(sIdx)) next.delete(sIdx);
                                        else next.add(sIdx);
                                        return next;
                                    });
                                }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    backgroundColor: '#252525',
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Season {season.seasonNumber}</h3>
                                    <span style={{ fontSize: '0.9rem', color: '#888' }}>({season.episodes.length} Episodes)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Are you sure you want to remove this season?')) {
                                                const newSeasons = [...(formData.seasons || [])];
                                                newSeasons.splice(sIdx, 1);
                                                setFormData(prev => ({ ...prev, seasons: newSeasons }));
                                            }
                                        }}
                                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                                </div>
                            </div>

                            {/* Season Body */}
                            {isExpanded && (
                                <div style={{ padding: '1rem', borderTop: '1px solid #333' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {season.episodes.map((ep, eIdx) => (
                                            <div key={ep.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', alignItems: 'center', backgroundColor: '#2a2a2a', padding: '0.75rem', borderRadius: '6px' }}>
                                                <span style={{ color: '#888', width: '20px' }}>{eIdx + 1}</span>
                                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem' }}>
                                                        <input
                                                            type="text"
                                                            value={ep.title}
                                                            onChange={(e) => updateEpisode(sIdx, eIdx, 'title', e.target.value)}
                                                            placeholder="Episode Title"
                                                            style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', fontSize: '1rem', fontWeight: '500' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={ep.duration || ''}
                                                            onChange={(e) => updateEpisode(sIdx, eIdx, 'duration', e.target.value)}
                                                            placeholder="Duration (e.g. 45m)"
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#ddd', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <input
                                                            type="text"
                                                            value={ep.thumbnailUrl || ''}
                                                            onChange={(e) => updateEpisode(sIdx, eIdx, 'thumbnailUrl', e.target.value)}
                                                            placeholder="Thumbnail URL"
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#ddd', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.85rem', flex: 1 }}
                                                        />
                                                        {ep.thumbnailUrl && (
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleApplySeason(sIdx, ep.thumbnailUrl!)}
                                                                    title="Apply to Season"
                                                                    style={{ fontSize: '0.7rem', padding: '4px 8px', backgroundColor: '#444', border: '1px solid #555', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                                                                >
                                                                    Season
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleApplySeries(ep.thumbnailUrl!)}
                                                                    title="Apply to entire Series"
                                                                    style={{ fontSize: '0.7rem', padding: '4px 8px', backgroundColor: '#662222', border: '1px solid #773333', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                                                                >
                                                                    Series
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={ep.description || ''}
                                                        onChange={(e) => updateEpisode(sIdx, eIdx, 'description', e.target.value)}
                                                        placeholder="Episode Description"
                                                        style={{ background: 'transparent', border: 'none', color: '#aaa', width: '100%', fontSize: '0.9rem' }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newSeasons = [...(formData.seasons || [])];
                                                        newSeasons[sIdx].episodes.splice(eIdx, 1);
                                                        setFormData(prev => ({ ...prev, seasons: newSeasons }));
                                                    }}
                                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newEpisode = {
                                                    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(),
                                                    title: `Episode ${season.episodes.length + 1}`,
                                                    duration: '',
                                                    description: ''
                                                };
                                                setFormData(prev => {
                                                    const newSeasons = [...(prev.seasons || [])];
                                                    const seasonCopy = { ...newSeasons[sIdx] };
                                                    const episodesCopy = [...(seasonCopy.episodes || [])];
                                                    episodesCopy.push(newEpisode);
                                                    seasonCopy.episodes = episodesCopy;
                                                    newSeasons[sIdx] = seasonCopy;
                                                    return { ...prev, seasons: newSeasons };
                                                });
                                            }}
                                            style={{ alignSelf: 'start', marginTop: '0.5rem', fontSize: '0.9rem', color: '#e50914', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        >
                                            + Add Episode
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EditorSeasons;
