import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMovieById, getRecommendations, getArticlesByMovieId, getMoviesByTag, getMoviesByPersonId } from '../../../lib/api';
import MoviePageClient from '../../../components/MoviePageClient';
import { isValidContent } from '../../../utils/formatUtils';

type Props = {
    params: Promise<{ id: string }>
};

// SEO Metadata Generator
// SEO Metadata Generator
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { id } = await params;
        const movie = await getMovieById(id);

        if (!movie) {
            return {
                title: 'Movie Not Found - Filmosphere',
            };
        }

        const title = movie.metaTitle || `${movie.title} (${movie.releaseYear}) - Filmosphere`;
        const description = movie.metaDescription || movie.description || `Watch ${movie.title} on Filmosphere.`;
        const image = movie.backdropUrl || movie.posterUrl || '/filmospere-social.png'; // Fallback to a default image if needed

        return {
            title,
            description,
            keywords: movie.keywords?.split(',').map(k => k.trim()) || [],
            openGraph: {
                title: movie.metaTitle || `${movie.title} (${movie.releaseYear})`,
                description,
                images: [image],
                type: movie.contentType === 'series' ? 'video.tv_show' : 'video.movie',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [image],
            }
        };
    } catch (e) {
        console.error('generateMetadata failed for MoviePage:', e);
        return {
            title: 'Error - Filmosphere',
        };
    }
}

export default async function MoviePage({ params }: Props) {
    const { id } = await params;
    const movie = await getMovieById(id);

    if (!movie) {
        notFound();
    }

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
    // structure: [recommendations, articles, genreMovies, cast1Movies, cast2Movies, industryMovies]
    const [recommendations, articles, genreMovies, cast1Movies, cast2Movies, industryMovies] = await Promise.all([
        getRecommendations(movie),
        getArticlesByMovieId(movie.id),
        genreTag ? getMoviesByTag(genreTag) : Promise.resolve([]),
        cast1 ? getMoviesByPersonId(cast1.id) : Promise.resolve([]),
        cast2 ? getMoviesByPersonId(cast2.id) : Promise.resolve([]),
        industryTag ? getMoviesByTag(industryTag) : Promise.resolve([])
    ]);

    console.log('[Movie Page Server] recommendations count:', recommendations.length);
    console.log('[Movie Page Server] recommendations sample:', recommendations.slice(0, 2).map(r => r.title));

    // Construct Sections Data to pass to client
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
                linkTo: `/person/${encodeURIComponent(cast1.name)}` // Simple search link for now
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
                linkTo: `/person/${encodeURIComponent(cast2.name)}`
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

    console.log('[Movie Page Server] Fetched data counts:', {
        genreMovies: genreMovies.length,
        cast1Movies: cast1Movies.length,
        cast2Movies: cast2Movies.length,
        industryMovies: industryMovies.length,
        extraSections: extraSections.length
    });

    console.log('[Movie Page Server] extraSections:', extraSections.map((s: any) => ({
        title: s.title,
        dataCount: s.data.length
    })));

    return (
        <MoviePageClient
            movie={movie}
            recommendations={recommendations}
            articles={articles}
            extraSections={extraSections}
        />
    );
}
