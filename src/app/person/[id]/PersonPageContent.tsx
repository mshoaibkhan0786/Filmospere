import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPersonById, getMoviesByPersonId } from '../../../lib/api';
import PersonPageClient from '../../../components/PersonPageClient';
import type { ActorDetails } from '../../../types';
import { User } from 'lucide-react';

interface Props {
    id: string;
}

// 1. Streaming Component that fetches everything
async function PersonPageContent({ id }: Props) {
    // Fire requests in parallel to avoid sequential latency penalties
    const personPromise = getPersonById(id);
    const moviesPromise = getMoviesByPersonId(id);

    const [personData, movies] = await Promise.all([personPromise, moviesPromise]);

    if (!personData) {
        notFound();
    }

    const person = personData as ActorDetails;

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

// 2. Beautiful Skeleton for instant TTFB
function PersonPageSkeleton() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white' }}>
            <div style={{ background: 'linear-gradient(to bottom, #1f1f1f 0%, #141414 100%)', paddingBottom: '3rem' }}>
                <div className="container actor-hero" style={{ padding: '4rem 1rem', display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                    <div style={{ width: '300px', height: '450px', backgroundColor: '#2a2a2a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s infinite ease-in-out' }}>
                        <User size={64} color="#666" />
                    </div>
                    <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
                        <div style={{ width: '60%', height: '3rem', backgroundColor: '#2a2a2a', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                        <div style={{ width: '30%', height: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                            <div style={{ width: '80px', height: '40px', backgroundColor: '#2a2a2a', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                            <div style={{ width: '120px', height: '40px', backgroundColor: '#2a2a2a', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                        </div>
                        <div style={{ width: '100%', height: '150px', backgroundColor: '#2a2a2a', borderRadius: '6px', marginTop: '1rem', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 0.3; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}

export { PersonPageContent, PersonPageSkeleton };
