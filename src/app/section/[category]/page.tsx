import { notFound, redirect } from 'next/navigation';
import { getMoviesByTag } from '@/lib/api';
import SectionPageClient from '@/components/SectionPageClient';
import { Metadata } from 'next';

interface Props {
    params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);

    // Normalize to Title Case for Logic Matching & Display (horror -> Horror)
    // Exception: web-series -> Web Series
    let displayTitle = decodedCategory;
    if (decodedCategory === 'web-series' || decodedCategory === 'series') {
        displayTitle = 'Web Series';
    } else if (decodedCategory === 'top-rated') {
        displayTitle = 'Top Rated';
    } else if (decodedCategory === 'new-releases') {
        displayTitle = 'New Releases';
    } else if (decodedCategory === 'sci-fi') {
        displayTitle = 'Sci-Fi';
    } else {
        displayTitle = decodedCategory.charAt(0).toUpperCase() + decodedCategory.slice(1).toLowerCase();
    }

    const currentYear = new Date().getFullYear();

    // SEO-Optimized Title Logic
    let title = `${displayTitle} Movies - Filmospere`;
    let description = `Browse the best ${displayTitle} movies and series on Filmospere.`;

    // specific overrides for high-value keywords (Now matches because displayTitle is Capitalized)
    if (['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance'].includes(displayTitle)) {
        title = `Top ${displayTitle} Movies of ${currentYear} & Best of All Time - Filmospere`;
        description = `Discover the top-rated ${displayTitle} movies of ${currentYear}. Explore our curated list of best ${displayTitle} films, reviews, and where to watch them.`;
    } else if (displayTitle === 'Web Series' || displayTitle === 'Series') {
        title = `Best Web Series of ${currentYear} to Watch Now - Filmospere`;
        description = `Find the most binge-worthy Web Series of ${currentYear}. Trending TV shows, top-rated series, and new releases on Netflix, Prime, and more.`;
    } else if (displayTitle === 'Trending') {
        title = `Trending Movies & Series ${currentYear} - What to Watch Now`;
        description = `See what's trending now! The most popular movies and web series of ${currentYear} that everyone is watching.`;
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: `https://filmospere.com/section/${decodedCategory.toLowerCase()}`
        }
    };
}

// Enable ISR with 30-day cache
export const revalidate = 2592000;
export const dynamicParams = true; // Allow other params to be generated on demand

export async function generateStaticParams() {
    const sections = [
        'trending',
        'top-rated',
        'new-releases',
        'web-series',
        'action'
    ];

    return sections.map((category) => ({
        category: category,
    }));
}

export default async function SectionPage({ params }: Props) {
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);

    // Server-side Redirect for Uppercase URLs (Canonicalization)
    if (decodedCategory !== decodedCategory.toLowerCase()) {
        redirect(`/section/${decodedCategory.toLowerCase()}`);
    }

    // Redirect 'sci-fi' to 'science-fiction' (User preference for this URL)
    if (decodedCategory === 'sci-fi') {
        redirect('/section/science-fiction');
    }

    // Redirect 'series' to 'web-series' (User request to remove duplicate)
    if (decodedCategory === 'series') {
        redirect('/section/web-series');
    }

    let displayTitle = decodedCategory;
    if (decodedCategory === 'web-series' || decodedCategory === 'series') {
        displayTitle = 'Web Series';
    } else if (decodedCategory === 'top-rated') {
        displayTitle = 'Top Rated';
    } else if (decodedCategory === 'new-releases') {
        displayTitle = 'New Releases';
    } else if (decodedCategory === 'sci-fi') {
        displayTitle = 'Sci-Fi';
    } else {
        displayTitle = decodedCategory.charAt(0).toUpperCase() + decodedCategory.slice(1).toLowerCase(); // Fallback
    }

    // Fetch Initial Data (Server Side)
    // We pass this initial data to the client component to hydrate the state
    const initialMovies = await getMoviesByTag(decodedCategory, 0, 20);

    // If no movies found for a valid category, we still just render the empty state.
    // If category is total nonsense, maybe 404? 
    // Implementation Plan said: "Fetches initial batch... handles Not Found".
    // For sections, usually valid even if empty, but let's stick to lenient rendering.

    return (
        <SectionPageClient
            title={displayTitle}
            initialMovies={initialMovies}
            hasInitialMore={initialMovies.length >= 20}
        />
    );
}
