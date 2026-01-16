"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Edit2, Save, X } from 'lucide-react';
import type { CastMember, Movie } from '../../types';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

const CastManager: React.FC = () => {
    // We need to manage movies locally to perform the "Global Cast" analysis
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const [editingMember, setEditingMember] = useState<CastMember | null>(null);
    // Track original name to find occurrences during update
    const [originalName, setOriginalName] = useState('');

    // Fetch all movies on mount to build cast index
    const fetchMovies = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('movies').select('*');
        if (error) {
            console.error('Error fetching movies for CastManager:', error);
        } else {
            // Transform data as usual
            const flattened = (data || []).map((m: any) => ({
                id: m.id,
                ...m.data
            })) as Movie[];
            setAllMovies(flattened);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    // Derive Unique Cast List
    const allCast = useMemo(() => {
        const uniqueCast = new Map<string, CastMember>();
        allMovies.forEach(movie => {
            if (movie.cast) {
                movie.cast.forEach(member => {
                    // Use Name as key because ID might be inconsistent or missing in raw data
                    // Ideally we use ID, but let's stick to Name for "Global Actor" concept
                    if (!uniqueCast.has(member.name)) {
                        uniqueCast.set(member.name, member);
                    }
                });
            }
        });
        return Array.from(uniqueCast.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [allMovies]);

    const filteredCast = useMemo(() => {
        if (!searchQuery) return allCast;
        const lowerQuery = searchQuery.toLowerCase();
        return allCast.filter(member =>
            member.name.toLowerCase().includes(lowerQuery)
        );
    }, [allCast, searchQuery]);

    const totalPages = Math.ceil(filteredCast.length / itemsPerPage);
    const paginatedCast = filteredCast.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleEditClick = (member: CastMember) => {
        setEditingMember({ ...member });
        setOriginalName(member.name);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMember && originalName) {
            setIsLoading(true);
            try {
                // Find all movies containing this actor
                const moviesToUpdate = allMovies.filter(m =>
                    m.cast && m.cast.some(c => c.name === originalName)
                );

                if (moviesToUpdate.length === 0) {
                    alert('No movies found with this actor.');
                    setIsLoading(false);
                    return;
                }

                // Update each movie locally
                const updatedMovies = moviesToUpdate.map(movie => {
                    const updatedCast = movie.cast.map(c => {
                        if (c.name === originalName) {
                            return { ...c, name: editingMember.name, imageUrl: editingMember.imageUrl };
                        }
                        return c;
                    });
                    const updatedMovie = { ...movie, cast: updatedCast };

                    // Un-flatten for specific DB update structure if needed, 
                    // BUT our 'movies' table is { id, data: JSONB }.
                    // We need to return the row shape: { id: ..., data: { ... } }
                    // Construct row for DB
                    const { id, ...dataFields } = updatedMovie;
                    return {
                        id: movie.id,
                        data: dataFields
                    };
                });

                // Bulk Upsert to Supabase
                const { error } = await supabase.from('movies').upsert(updatedMovies);

                if (error) {
                    throw error;
                }

                alert(`Updated actor details in ${updatedMovies.length} movies.`);
                setEditingMember(null);
                fetchMovies(); // Refresh data
            } catch (err) {
                console.error(err);
                alert('Failed to update cast member.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (isLoading && allMovies.length === 0) {
        return <div style={{ color: 'white', padding: '2rem' }}>Loading Cast Database...</div>;
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Manage Cast</h1>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input
                    type="text"
                    placeholder="Search actors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 10px 10px 40px',
                        borderRadius: '8px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #333',
                        color: 'white',
                        fontSize: '1rem'
                    }}
                />
            </div>

            {/* Pagination Controls (Top) */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ color: '#888' }}>
                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCast.length)} of {filteredCast.length}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: currentPage === 1 ? '#222' : '#333',
                                color: currentPage === 1 ? '#666' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Previous
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: currentPage === totalPages ? '#222' : '#333',
                                color: currentPage === totalPages ? '#666' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Cast Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {paginatedCast.map((member, i) => (
                    <div key={`${member.name}-${i}`} style={{ backgroundColor: '#2a2a2a', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ aspectRatio: '2/3', backgroundColor: '#1a1a1a' }}>
                            {member.imageUrl ? (
                                <img
                                    src={getOptimizedImageUrl(member.imageUrl, 300)}
                                    alt={member.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x300?text=No+Image';
                                    }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                    No Image
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{member.name}</h3>
                            <button
                                onClick={() => handleEditClick(member)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    backgroundColor: '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls (Bottom) */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '1rem' }}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: currentPage === 1 ? '#222' : '#333',
                            color: currentPage === 1 ? '#666' : 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: currentPage === totalPages ? '#222' : '#333',
                            color: currentPage === totalPages ? '#666' : 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            {editingMember && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px', position: 'relative' }}>
                        <button
                            onClick={() => setEditingMember(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Edit Cast Member</h2>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Name</label>
                                <input
                                    type="text"
                                    value={editingMember.name}
                                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Image URL</label>
                                <input
                                    type="url"
                                    value={editingMember.imageUrl || ''}
                                    onChange={(e) => setEditingMember({ ...editingMember, imageUrl: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: 'white' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#e50914',
                                        color: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        opacity: isLoading ? 0.7 : 1
                                    }}
                                >
                                    <Save size={20} /> {isLoading ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CastManager;
