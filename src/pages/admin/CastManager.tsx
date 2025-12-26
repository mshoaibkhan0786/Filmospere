import React, { useState, useMemo } from 'react';
import { useMovies } from '../../context/MovieContext';
import { Search, Edit2, Save, X } from 'lucide-react';
import type { CastMember } from '../../types';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

const CastManager: React.FC = () => {
    const { getAllCast, updateCastMember } = useMovies();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const [editingMember, setEditingMember] = useState<CastMember | null>(null);

    const allCast = useMemo(() => getAllCast(), [getAllCast]);

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

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMember) {
            updateCastMember(editingMember);
            setEditingMember(null);
        }
    };

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
                {paginatedCast.map(member => (
                    <div key={member.id} style={{ backgroundColor: '#2a2a2a', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
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
                                onClick={() => setEditingMember(member)}
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
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#e50914',
                                        color: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Save size={20} /> Save Changes
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
