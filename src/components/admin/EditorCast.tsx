"use client";

import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import type { Movie, CastMember } from '../../types';

interface EditorCastProps {
    formData: Partial<Movie>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Movie>>>;
    existingActors: { name: string; imageUrl?: string }[];
}

const EditorCast: React.FC<EditorCastProps> = ({ formData, setFormData, existingActors }) => {
    const [actorSearch, setActorSearch] = useState('');
    const [filteredActors, setFilteredActors] = useState<{ name: string; imageUrl?: string }[]>([]);

    useEffect(() => {
        if (actorSearch.trim() === '') {
            setFilteredActors(existingActors);
        } else {
            const lowerSearch = actorSearch.toLowerCase();
            setFilteredActors(existingActors.filter(a => a.name.toLowerCase().includes(lowerSearch)));
        }
    }, [actorSearch, existingActors]);

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Cast</h2>

            {/* Cast List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {formData.cast?.map((member, index) => (
                    <div key={member.id} style={{ backgroundColor: '#2a2a2a', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid #404040', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}>
                        <button
                            type="button"
                            onClick={() => {
                                const newCast = [...(formData.cast || [])];
                                newCast.splice(index, 1);
                                setFormData(prev => ({ ...prev, cast: newCast }));
                            }}
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                        <div style={{ aspectRatio: '2/3', backgroundColor: '#1a1a1a' }}>
                            {member.imageUrl ? (
                                <img src={member.imageUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No Image</div>
                            )}
                        </div>
                        <div style={{ padding: '0.5rem' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{member.name}</div>
                            <input
                                type="text"
                                value={member.role}
                                onChange={(e) => {
                                    const newCast = [...(formData.cast || [])];
                                    newCast[index] = { ...newCast[index], role: e.target.value };
                                    setFormData(prev => ({ ...prev, cast: newCast }));
                                }}
                                placeholder="Role"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    fontSize: '0.85rem',
                                    borderRadius: '6px',
                                    backgroundColor: '#151515',
                                    border: '1px solid #333',
                                    color: 'white',
                                    marginTop: '0.25rem'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Cast Form */}
            <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #404040', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Add Cast Member</h3>

                {/* Search Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Search Existing Actor</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            value={actorSearch}
                            onChange={(e) => setActorSearch(e.target.value)}
                            placeholder="Type to filter..."
                            style={{ flex: 2, padding: '0.75rem', borderRadius: '8px', backgroundColor: '#151515', border: '1px solid #333', color: 'white' }}
                        />
                        <select
                            onChange={(e) => {
                                const actor = existingActors.find(a => a.name === e.target.value);
                                if (actor) {
                                    (document.getElementById('newCastName') as HTMLInputElement).value = actor.name;
                                    (document.getElementById('newCastImage') as HTMLInputElement).value = actor.imageUrl || '';
                                    setActorSearch(''); // Reset search after selection
                                }
                            }}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', backgroundColor: '#151515', border: '1px solid #333', color: 'white' }}
                        >
                            <option value="">-- Select from {filteredActors.length} Actors --</option>
                            {filteredActors.map(actor => (
                                <option key={actor.name} value={actor.name}>{actor.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Manual Entry Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Name</label>
                        <input
                            type="text"
                            id="newCastName"
                            placeholder="Actor Name"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#151515', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Role</label>
                        <input
                            type="text"
                            id="newCastRole"
                            placeholder="Character Name (Default: Actor)"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#151515', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Image URL</label>
                        <input
                            type="url"
                            id="newCastImage"
                            placeholder="https://..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#151515', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        const nameInput = document.getElementById('newCastName') as HTMLInputElement;
                        const roleInput = document.getElementById('newCastRole') as HTMLInputElement;
                        const imageInput = document.getElementById('newCastImage') as HTMLInputElement;

                        if (nameInput.value) {
                            const newMember: CastMember = {
                                id: crypto.randomUUID(),
                                name: nameInput.value,
                                role: roleInput.value.trim() || 'Actor', // Default to 'Actor' if empty
                                imageUrl: imageInput.value
                            };
                            setFormData(prev => ({ ...prev, cast: [...(prev.cast || []), newMember] }));

                            // Clear inputs
                            nameInput.value = '';
                            roleInput.value = '';
                            imageInput.value = '';
                        }
                    }}
                    style={{
                        backgroundColor: '#333',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: 'none',
                        width: '100%',
                        marginTop: '1.5rem',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Add Cast Member
                </button>
            </div>
        </div>
    );
};

export default EditorCast;
