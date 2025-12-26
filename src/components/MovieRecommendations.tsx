import React, { useState, useEffect } from 'react';
import type { Movie } from '../types';
import { useMovies } from '../context/MovieContext';
import { isValidContent } from '../utils/formatUtils';
import HorizontalScrollSection from './HorizontalScrollSection';

interface MovieRecommendationsProps {
    currentMovie: Movie;
}

const MovieRecommendations: React.FC<MovieRecommendationsProps> = ({ currentMovie }) => {
    const { movies } = useMovies();
    const [recommendations, setRecommendations] = useState<Movie[]>([]);

    useEffect(() => {
        if (!movies || movies.length === 0) return;

        // Run calculation in a timeout to unblock the main render thread
        const timeoutId = setTimeout(() => {
            const recs = movies
                .filter(m => m.id !== currentMovie.id && isValidContent(m)) // Exclude current movie and invalid content
                .map(m => {
                    let score = 0;

                    // Guard against missing tags
                    const mTags = m.tags || [];
                    const currentTags = currentMovie.tags || [];

                    // Tag matching (High weight)
                    const sharedTags = mTags.filter(tag => currentTags.includes(tag));
                    score += sharedTags.length * 3;

                    // Director matching (Medium weight)
                    if (m.director && currentMovie.director && m.director === currentMovie.director) score += 5;

                    // Content Type matching (Low weight)
                    if (m.contentType === currentMovie.contentType) score += 2;

                    return { movie: m, score };
                })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map(item => item.movie);

            setRecommendations(recs);
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [movies, currentMovie]);

    if (recommendations.length === 0) return null;

    return (
        <HorizontalScrollSection
            title="You May Also Like"
            data={recommendations}
        />
    );
};

export default MovieRecommendations;
