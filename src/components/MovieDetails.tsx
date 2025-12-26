import React from 'react';
import type { Movie } from '../types';
import { X } from 'lucide-react';
import MovieInfo from './MovieInfo';

interface MovieDetailsProps {
    movie: Movie;
    onClose: () => void;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#181818',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '50%',
                        padding: '8px',
                        color: 'white',
                        zIndex: 10
                    }}
                >
                    <X size={24} />
                </button>

                {movie.isCopyrightFree && movie.videoUrl ? (
                    <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: 'black' }}>
                        <video
                            src={movie.videoUrl}
                            controls
                            autoPlay
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                ) : (
                    <div style={{
                        height: '300px',
                        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0), #181818), url(${movie.posterUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }} />
                )}

                <MovieInfo movie={movie} />
            </div>
        </div>
    );
};

export default MovieDetails;
