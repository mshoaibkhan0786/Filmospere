import React, { useState, useEffect } from 'react';
import { useMovies } from '../../context/MovieContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import type { Movie } from '../../types';
import EditorBasicInfo from '../../components/admin/EditorBasicInfo';
import EditorMedia from '../../components/admin/EditorMedia';
import EditorCast from '../../components/admin/EditorCast';
import EditorSeasons from '../../components/admin/EditorSeasons';
import EditorStreaming from '../../components/admin/EditorStreaming';

const MovieEditor: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getMovie, addMovie, updateMovie, movies } = useMovies();

    const [formData, setFormData] = useState<Partial<Movie>>({
        title: '',
        description: '',
        posterUrl: '',
        images: [],
        videos: [],
        seasons: [],
        releaseYear: new Date().getFullYear(),
        releaseDate: '',
        budget: '',
        boxOffice: '',
        duration: '',
        director: '',
        rating: 0,
        tags: [],
        hiddenTags: [],
        cast: [],
        languages: ['English'],
        language: 'English',
        trailerUrl: '',
        streamingLinks: []
    });

    // Compute unique actors from existing movies for the Cast Selector
    const [existingActors, setExistingActors] = useState<{ name: string; imageUrl?: string }[]>([]);

    useEffect(() => {
        const actorsMap = new Map<string, string | undefined>();
        movies.forEach(movie => {
            movie.cast?.forEach(member => {
                if (member.name && !actorsMap.has(member.name)) {
                    actorsMap.set(member.name, member.imageUrl);
                }
            });
        });

        const actorsList = Array.from(actorsMap.entries()).map(([name, imageUrl]) => ({ name, imageUrl }));
        setExistingActors(actorsList);
    }, [movies]);

    const [pendingStreamingLink, setPendingStreamingLink] = useState({ platform: '', url: '' });

    // ... (rest of effects)

    useEffect(() => {
        if (id) {
            const movie = getMovie(id);
            if (movie) {
                setFormData(movie);
            }
        }
    }, [id, getMovie]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-add pending streaming link if present
        let currentLinks = formData.streamingLinks || [];
        if (pendingStreamingLink.platform) {
            currentLinks = [...currentLinks, pendingStreamingLink];
        }

        const movieToSave = {
            ...formData,
            streamingLinks: currentLinks
        };

        if (id) {
            updateMovie(id, movieToSave);
        } else {
            addMovie({
                ...movieToSave,
                id: crypto.randomUUID(),
                views: 0,
                voteCount: (movieToSave.releaseYear || new Date().getFullYear()) > 2010
                    ? Math.floor(Math.random() * (1300 - 600 + 1)) + 600
                    : Math.floor(Math.random() * (600 - 150 + 1)) + 150,
                isCopyrightFree: false,
                contentType: 'movie',
                images: (movieToSave.images && movieToSave.images.length > 0) ? movieToSave.images : (movieToSave.posterUrl ? [movieToSave.posterUrl] : [])
            } as Movie);
        }
        navigate('/admin/movies');
    };

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 2rem', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/admin/movies')}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>{id ? 'Edit Movie' : 'Add New Movie'}</h1>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>

                <EditorBasicInfo formData={formData} setFormData={setFormData} />

                <EditorMedia formData={formData} setFormData={setFormData} />

                <EditorStreaming
                    formData={formData}
                    setFormData={setFormData}
                    pendingLink={pendingStreamingLink}
                    setPendingLink={setPendingStreamingLink}
                />

                {formData.contentType === 'series' && (
                    <EditorSeasons formData={formData} setFormData={setFormData} />
                )}

                <EditorCast formData={formData} setFormData={setFormData} existingActors={existingActors} />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button
                        type="submit"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#e50914',
                            color: 'white',
                            padding: '1rem 2rem',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(229, 9, 20, 0.3)'
                        }}
                    >
                        <Save size={20} />
                        Save Movie
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MovieEditor;
