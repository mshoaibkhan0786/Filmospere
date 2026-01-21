import React from 'react';
import HorizontalScrollSection from './HorizontalScrollSection';
import type { Movie } from '../types';

interface Props {
    movie: Movie;
}

const RelatedSectionsSkeleton: React.FC<Props> = ({ movie }) => {
    // Mimic the logic in MovieRelatedSections to show correct skeleton titles
    const genreTag = movie.tags && movie.tags.length > 0 ? movie.tags[0] : null;
    const cast1 = movie.cast && movie.cast.length > 0 ? movie.cast[0] : null;
    const cast2 = movie.cast && movie.cast.length > 1 ? movie.cast[1] : null;

    const INDUSTRIES = [
        'Bollywood', 'Tollywood', 'Kollywood', 'Mollywood', 'Sandalwood',
        'Hollywood', 'Pollywood', 'Bengali Cinema', 'Marathi Cinema',
        'K-Drama', 'Anime', 'Chinese Cinema'
    ];
    const industryTag = movie.tags?.find(t => INDUSTRIES.includes(t)) || null;

    return (
        <div style={{ marginTop: '2rem' }}>
            {/* Always show Recommendations skeleton */}
            <div style={{ marginBottom: '1.5rem' }}>
                <HorizontalScrollSection title="You May Also Like" data={[]} loading={true} />
            </div>

            {/* Approximate Extra Sections */}
            {genreTag && (
                <div style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                    <HorizontalScrollSection title={`More ${genreTag} Movies`} data={[]} loading={true} />
                </div>
            )}

            {cast1 && (
                <div style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                    <HorizontalScrollSection title={`Starring ${cast1.name}`} data={[]} loading={true} />
                </div>
            )}

            {cast2 && (
                <div style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                    <HorizontalScrollSection title={`Starring ${cast2.name}`} data={[]} loading={true} />
                </div>
            )}

            {industryTag && (
                <div style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                    <HorizontalScrollSection title={`More from ${industryTag}`} data={[]} loading={true} />
                </div>
            )}
        </div>
    );
};

export default RelatedSectionsSkeleton;
