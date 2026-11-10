import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { searchMovies } from '@/lib/api';
import SearchPageClient from '@/components/SearchPageClient';
import PageSkeleton from '@/components/PageSkeleton';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface SearchPageProps {
    searchParams: Promise<{ q?: string; search?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
    const params = await searchParams;
    const query = (params?.q || params?.search || '').trim();

    const title = query ? `Search results for "${query}" - Filmospere` : 'Search Movies & Series - Filmospere';
    const description = query
        ? `Explore movies and series matching "${query}" on Filmospere.`
        : 'Search movies, web series, and actors on Filmospere.';

    return {
        title,
        description,
        robots: {
            index: false,
            follow: true,
        },
    };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = (params?.q || params?.search || '').trim();

    let initialResults: any[] = [];
    if (query.length >= 2) {
        const { results } = await searchMovies(query, 0, 10);
        initialResults = results;
    }

    return (
        <Suspense fallback={<PageSkeleton />}>
            <SearchPageClient
                key={query}
                initialQuery={query}
                initialResults={initialResults}
                initialCount={initialResults.length}
            />
        </Suspense>
    );
}
