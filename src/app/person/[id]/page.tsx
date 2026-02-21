import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPersonById, getMoviesByPersonId } from '../../../lib/api';
import PersonPageClient from '../../../components/PersonPageClient';
import type { ActorDetails } from '../../../types';

import { supabase } from '../../../lib/supabase';

type Props = {
    params: Promise<{ id: string }>
};

// Enable ISR with 30-day cache
export const revalidate = 2592000;
export const dynamicParams = true;

export async function generateStaticParams() {
    try {
        const { data, error } = await supabase
            .from('persons')
            .select('data->>id')
            .order('id', { ascending: false })
            .limit(500); // Fewer persons to save build time

        if (error || !data) return [];

        return data.map((person: any) => ({
            id: person.id?.toString(),
        }));
    } catch {
        return [];
    }
}

// SEO Metadata Generator
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { id } = await params;
        const person = await getPersonById(id);

        if (!person) {
            return {
                title: 'Person Not Found - Filmospere',
            };
        }

        const name = person.name;
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
            title: 'Error - Filmosphere',
        };
    }
}

export default async function PersonPage({ params }: Props) {
    const { id } = await params;

    // 1. Fetch Person Details (includes movie_credits from TMDB)
    const personData = await getPersonById(id);

    if (!personData) {
        notFound();
    }

    // 2. Fetch Movies (using Vite-matched logic from api.ts)
    const movies = await getMoviesByPersonId(id);

    if (!personData) {
        notFound();
    }

    // Ensure personData matches ActorDetails type (casting mostly safe due to api implementation)
    const person = personData as ActorDetails;

    // Schema.org Structured Data
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": person.name,
        "image": person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : undefined,
        "description": person.biography ? person.biography.substring(0, 500) : undefined,
        "birthDate": person.birthday,
        "jobTitle": person.known_for_department,
        "sameAs": [
            person.external_ids?.twitter_id ? `https://twitter.com/${person.external_ids.twitter_id}` : null,
            person.external_ids?.instagram_id ? `https://instagram.com/${person.external_ids.instagram_id}` : null,
            person.external_ids?.facebook_id ? `https://facebook.com/${person.external_ids.facebook_id}` : null,
            person.external_ids?.imdb_id ? `https://www.imdb.com/name/${person.external_ids.imdb_id}` : null
        ].filter(Boolean)
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />
            <PersonPageClient
                person={person}
                movies={movies}
            />
        </>
    );
}
