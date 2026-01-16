import React from 'react';
import { getHomeData } from '@/lib/api';
import HomeClient from '@/components/HomeClient';
import HeroSkeleton from '@/components/HeroSkeleton';

export const revalidate = 3600;

// Server Component for Initial Data Patching
export default async function Home() {
  // Fetch initial data using getHomeData which returns { movies, sections }
  // matching the structure needed for HomeClient hydration.
  // This ensures the client component has data immediately without initial fetch delay,
  // effectively replicating the "loaded" state of the SPA.
  const { movies, sections } = await getHomeData();

  return (
    <React.Suspense fallback={<HeroSkeleton />}>
      <HomeClient
        initialMovies={movies || []}
        initialSections={sections || []}
      />
    </React.Suspense>
  );
}
