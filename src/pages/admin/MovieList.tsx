import React, { useState } from 'react';
import { useMovies } from '../../context/MovieContext';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import ConfirmationModal from '../../components/admin/ConfirmationModal';

const MovieList: React.FC = () => {
    const { movies, deleteMovie } = useMovies();
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; movieId: string | null }>({
        isOpen: false,
        movieId: null
    });

    const handleDeleteClick = (id: string) => {
        setDeleteModal({ isOpen: true, movieId: id });
    };

    const confirmDelete = () => {
        if (deleteModal.movieId) {
            deleteMovie(deleteModal.movieId);
            setDeleteModal({ isOpen: false, movieId: null });
        }
    };

    const filteredMovies = movies.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [visibleCount, setVisibleCount] = useState(50);

    // Reset visible count when search changes
    React.useEffect(() => {
        setVisibleCount(50);
    }, [searchTerm]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Manage Movies</h1>
                <Link
                    to="/admin/movies/new"
                    style={{
                        backgroundColor: '#e50914',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 'bold'
                    }}
                >
                    <Plus size={20} /> Add Movie
                </Link>
            </div>

            <div style={{ marginBottom: '2rem', position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input
                    type="text"
                    placeholder="Search movies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3rem',
                        backgroundColor: '#2a2a2a',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '1rem'
                    }}
                />
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredMovies.slice(0, visibleCount).map(movie => (
                    <div key={movie.id} style={{ backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img src={movie.posterUrl} alt="" style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} />
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{movie.title}</div>
                                <div style={{ color: '#888', fontSize: '0.9rem' }}>{movie.releaseYear} • {movie.director}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link
                                to={`/admin/movies/edit/${movie.id}`}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    backgroundColor: '#3b82f620',
                                    color: '#3b82f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Edit size={20} />
                            </Link>
                            <button
                                onClick={() => handleDeleteClick(movie.id)}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    backgroundColor: '#ef444420',
                                    color: '#ef4444',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {visibleCount < filteredMovies.length && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                    <button
                        onClick={() => setVisibleCount(prev => prev + 50)}
                        style={{
                            backgroundColor: '#333',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#444'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#333'}
                    >
                        Load More Movies ({filteredMovies.length - visibleCount} remaining)
                    </button>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Delete Movie"
                message="Are you sure you want to delete this movie? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, movieId: null })}
            />
        </div>
    );
};

export default MovieList;
