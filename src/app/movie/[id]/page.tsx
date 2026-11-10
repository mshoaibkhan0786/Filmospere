import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getMovieById } from '../../../lib/api';
import MoviePageClient from '../../../components/MoviePageClient';
import MovieRelatedSections from '../../../components/MovieRelatedSections';
import RelatedSectionsSkeleton from '../../../components/RelatedSectionsSkeleton';
import MovieArticlesSidebar from '../../../components/MovieArticlesSidebar';

type Props = {
    params: Promise<{ id: string }>
};

// Configure as dynamic server-rendered route
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// SEO Metadata Generator
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const id = resolvedParams?.id;
        if (!id) {
            return {
                title: 'Movie Not Found - Filmospere',
            };
        }

        let movie = null;
        try {
            movie = await getMovieById(id);
        } catch (e) {
            console.error('getMovieById error in generateMetadata:', e);
        }

        if (!movie) {
            return {
                title: 'Movie Not Found - Filmospere',
            };
        }

        const title = movie.metaTitle || `${movie.title || 'Movie'} (${movie.releaseYear || ''}) - Filmospere`;
        const description = movie.metaDescription || movie.description || `Watch ${movie.title || 'movies'} on Filmospere.`;

        // FIX: Googlebot blocks wsrv.nl images. We must use the RAW TMDB URL for metadata.
        // Convert: https://wsrv.nl/?url=https://image.tmdb.org/t/p/original/xyz.jpg -> https://image.tmdb.org/t/p/original/xyz.jpg
        let image = movie.backdropUrl || movie.posterUrl || '/filmospere-social.png';
        if (image && typeof image === 'string' && image.includes('wsrv.nl')) {
            try {
                const urlObj = new URL(image);
                const rawUrl = urlObj.searchParams.get('url');
                if (rawUrl) image = rawUrl;
            } catch (e) {
                // Keep original if parsing fails
            }
        }

        // Manual Content Moderation
        // 1. MATURE CONTENT (Rated 18+, Erotica, Sensitive Themes)
        // Strategy: Allow Indexing (to keep traffic) but label as Mature to avoid SafeSearch penalties.
        const MATURE_SLUGS = [
            'ggs-ganteng-ganteng-sange-2023',
            'when-a-hot-night-opens-2-2021',
            'what-fun-we-were-having-4-stories-about-date-rape-2011',
            'ang-daigdig-ay-isang-butil-na-luha-1986',
            'the-illusioned-ones-2025',
            'ligaw-2025',
            'the-shameful-secret-of-a-good-boy-1976',
            'last-exit-to-brooklyn-1989',
            'gloomy-sunday-1999'
        ];

        // Certification-based Auto-Tagging
        // e.g. 'R', 'NC-17', '18+', 'TV-MA' (if strictly adult content is expected in TV-MA)
        // Note: TV-MA is broad, so we might exclude it to avoid over-flagging standard shows like 'The Boys'.
        // We focus on explicit adult ratings.
        const MATURE_CERTIFICATIONS = ['NC-17', '18+', 'R21', 'R18'];
        // Note: 'R' is usually safe for general index (e.g. Deadpool), so we don't force 'mature' meta for all 'R'.
        // We rely on the specific slug list + 'NC-17'/'18+' for the heavy stuff.

        const isCertifiedMature = typeof movie.certification === 'string' && MATURE_CERTIFICATIONS.some(c => movie.certification?.toUpperCase().includes(c));

        const isMature = MATURE_SLUGS.includes(id)
            || (movie.slug ? MATURE_SLUGS.includes(movie.slug) : false)
            || Boolean(isCertifiedMature);

        // 2. STRICTLY RESTRICTED (Illegal, Harmful, DMCA takedowns)
        // Strategy: NoIndex completely.
        const RESTRICTED_SLUGS: string[] = []; // Currently empty as user wants traffic for previous items
        const isRestricted = RESTRICTED_SLUGS.includes(id) || (movie.slug ? RESTRICTED_SLUGS.includes(movie.slug) : false);

        const rawSlug = movie.slug || movie.id || id;
        const canonicalSlug = typeof rawSlug === 'string' ? rawSlug.replace(/\s+/g, '-') : id;

        return {
            title,
            description,
            robots: {
                index: !isRestricted, // Allow indexing for Mature, block for Restricted
                follow: !isRestricted,
            },
            // Add Mature Tags if applicable
            ...(isMature ? {
                other: {
                    rating: 'mature',
                    audience: 'Mature',
                    googlebot: 'index, noimageindex' // Optional safety: Index text but maybe not images if risqué
                }
            } : {}),
            keywords: movie.keywords?.split(',').map(k => k.trim()) || [],
            alternates: {
                canonical: `https://filmospere.com/movie/${canonicalSlug}`
            },
            openGraph: {
                title: movie.metaTitle || `${movie.title || 'Movie'} (${movie.releaseYear || ''})`,
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
            title: 'Movie Not Found - Filmospere',
        };
    }
}

export default async function MoviePage({ params }: Props) {
    let id: string | null = null;
    try {
        const resolvedParams = await params;
        id = resolvedParams?.id ?? null;
    } catch (e) {
        console.error('Failed to resolve params in MoviePage:', e);
        notFound();
    }

    if (!id) {
        notFound();
    }

    // 1. Fetch Critical Data (Blocking)
    // Only fetch the main movie details + sidebar articles. 
    // This allows the page to paint "Above the Fold" content (Hero, Info) instantly.
    let movie = null;
    try {
        movie = await getMovieById(id);
    } catch (e) {
        console.error('Failed to fetch movie by id in MoviePage:', id, e);
    }

    if (!movie) {
        notFound();
    }

    return (
        <MoviePageClient
            movie={movie}
            recommendations={[]} // Now streamed via children
            articles={[]}        // Decoupled, streamed via sidebarSlot
            extraSections={[]}   // Now streamed via children
            sidebarSlot={
                <Suspense fallback={<div style={{ height: '200px' }} />} >
                    <MovieArticlesSidebar movieId={movie.id} />
                </Suspense>
            }
        >
            {/* 2. Stream Related Content (Non-Blocking) */}
            <Suspense fallback={<RelatedSectionsSkeleton movie={movie} />}>
                <MovieRelatedSections movie={movie} />
            </Suspense>
        </MoviePageClient>
    );
}
