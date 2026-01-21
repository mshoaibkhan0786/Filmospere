import React from 'react';
import { getRecommendations, getMoviesByTag, getMoviesByPersonId } from '../lib/api';
import HorizontalScrollSection from './HorizontalScrollSection';
import { isValidContent } from '../utils/formatUtils';
import type { Movie } from '../types';

interface Props {
    movie: Movie;
}

export default async function MovieRelatedSections({ movie }: Props) {
    // Identify Keys for related content
    const genreTag = movie.tags && movie.tags.length > 0 ? movie.tags[0] : null;
    const cast1 = movie.cast && movie.cast.length > 0 ? movie.cast[0] : null;
    const cast2 = movie.cast && movie.cast.length > 1 ? movie.cast[1] : null;

    const INDUSTRIES = [
        'Bollywood', 'Tollywood', 'Kollywood', 'Mollywood', 'Sandalwood',
        'Hollywood', 'Pollywood', 'Bengali Cinema', 'Marathi Cinema',
        'K-Drama', 'Anime', 'Chinese Cinema'
    ];
    const industryTag = movie.tags?.find(t => INDUSTRIES.includes(t)) || null;

    // Parallel fetch for related data
    const [recommendations, genreMovies, cast1Movies, cast2Movies, industryMovies] = await Promise.all([
        getRecommendations(movie),
        genreTag ? getMoviesByTag(genreTag) : Promise.resolve([]),
        cast1 ? getMoviesByPersonId(cast1.id) : Promise.resolve([]),
        cast2 ? getMoviesByPersonId(cast2.id) : Promise.resolve([]),
        industryTag ? getMoviesByTag(industryTag) : Promise.resolve([])
    ]);

    const extraSections = [];

    // 1. More [Genre]
    if (genreMovies.length > 0) {
        const filtered = genreMovies.filter(m => m.id !== movie.id && isValidContent(m)).slice(0, 10);
        if (filtered.length > 0) {
            extraSections.push({
                title: `More ${genreTag} Movies`,
                data: filtered,
                linkTo: `/section/${encodeURIComponent(genreTag!)}`
            });
        }
    }

    // 2. Starring [Cast 1]
    if (cast1Movies.length > 0 && cast1) {
        const filtered = cast1Movies.filter(m => m.id !== movie.id && isValidContent(m)).slice(0, 10);
        if (filtered.length > 0) {
            extraSections.push({
                title: `Starring ${cast1.name}`,
                data: filtered,
                linkTo: `/person/${cast1.id}`
            });
        }
    }

    // 3. Starring [Cast 2]
    if (cast2Movies.length > 0 && cast2) {
        const filtered = cast2Movies.filter(m => m.id !== movie.id && isValidContent(m)).slice(0, 10);
        if (filtered.length > 0) {
            extraSections.push({
                title: `Starring ${cast2.name}`,
                data: filtered,
                linkTo: `/person/${cast2.id}`
            });
        }
    }

    // 4. More from [Industry]
    if (industryMovies.length > 0 && industryTag) {
        const filtered = industryMovies.filter(m => m.id !== movie.id && isValidContent(m)).slice(0, 10);
        if (filtered.length > 0) {
            extraSections.push({
                title: `More from ${industryTag}`,
                data: filtered,
                linkTo: `/section/${encodeURIComponent(industryTag)}`
            });
        }
    }

    return (
        <div style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease' }}>
            {/* You May Also Like */}
            {recommendations.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <HorizontalScrollSection title="You May Also Like" data={recommendations} linkTo="#" />
                </div>
            )}

            {/* Extra Sections */}
            {extraSections.map((section, index) => (
                <div key={index} style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                    <HorizontalScrollSection
                        title={section.title}
                        data={section.data}
                        linkTo={section.linkTo}
                    />
                </div>
            ))}
        </div>
    );
}
