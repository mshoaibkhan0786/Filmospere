import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getPersonById } from '../../../lib/api';
import { PersonPageContent, PersonPageSkeleton } from './PersonPageContent';

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
                title: 'Person Not Found - Filmospere',
            };
        }

        let person = null;
        try {
            person = await getPersonById(id);
        } catch (e) {
            console.error('getPersonById failed in generateMetadata:', e);
        }

        if (!person) {
            return {
                title: 'Person Not Found - Filmospere',
            };
        }

        const name = person.name || 'Unknown Person';
        // "No Index" Logic for Thin Content (matching Vite)
        if (!person.biography || person.biography.length < 50) {
            return {
                title: `${name} - Filmospere`,
                robots: {
                    index: false,
                    follow: false,
                },
            };
        }

        const desc = person.biography
            ? `${name} - Biography, Movies, and Filmography. ${person.biography.substring(0, 100)}...`
            : `Explore movies and biography of ${name} on Filmospere.`;

        const image = person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : '/filmospere-social.png';

        return {
            title: `${name} - Movies, Bio & Filmography | Filmospere`,
            description: desc,
            openGraph: {
                title: `${name} - Filmospere`,
                description: desc,
                images: [image],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${name} - Filmospere`,
                description: desc,
                images: [image],
            },
            robots: {
                index: true,
                follow: true,
            },
            alternates: {
                canonical: `https://filmospere.com/person/${id}`
            },
        };
    } catch (e) {
        console.error('generateMetadata failed for PersonPage:', e);
        return {
            title: 'Person Not Found - Filmospere',
        };
    }
}

export default async function PersonPage({ params }: Props) {
    let id: string | null = null;
    try {
        const resolvedParams = await params;
        id = resolvedParams?.id ?? null;
    } catch (e) {
        console.error('Failed to resolve params in PersonPage:', e);
        notFound();
    }

    if (!id) {
        notFound();
    }

    // React Suspense guarantees first byte is delivered instantly via skeleton
    return (
        <Suspense fallback={<PersonPageSkeleton />}>
            <PersonPageContent id={id} />
        </Suspense>
    );
}
