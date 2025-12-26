import { supabase } from '../lib/supabase';
import type { ActorDetails } from '../types';

/**
 * Caches person details (Biography, Image, Name) to the Supabase 'cast' table.
 * This ensures we don't have to hit TMDB every time for the same person.
 */
export const cachePersonDetails = async (tmdbId: string, details: ActorDetails) => {
    if (!tmdbId || !details) return;

    try {
        // CRITICAL: Check if we already have ANY bio - don't overwrite existing content!
        const { data: existing, error: fetchErr } = await supabase
            .from('cast')
            .select('biography, updated_at')
            .eq('tmdb_id', `tmdb-person-${tmdbId}`)
            .single();

        // If bio exists (not null), preserve it - even if short/empty string
        const shouldPreserveBio = !fetchErr && existing?.biography !== null && existing?.biography !== undefined;

        const row = {
            tmdb_id: `tmdb-person-${tmdbId}`, // Standardized format
            name: details.name,
            // ONLY update bio if it's NULL, otherwise preserve existing
            biography: shouldPreserveBio ? existing.biography : (details.biography || ""), // Save empty string if null, so we know we checked
            image_url: details.profile_path || null,
            birthday: details.birthday || null,
            deathday: details.deathday || null,
            place_of_birth: details.place_of_birth || null,
            known_for_department: details.known_for_department || null
        };

        const { error } = await supabase
            .from('cast')
            .upsert(row, {
                onConflict: 'tmdb_id',
                ignoreDuplicates: false // Update metadata, but preserve bio
            });

        if (error) {
            console.error('[PersonCache] CRITICAL: Failed to cache person details:', error.message, error.details);
            return false;
        } else {
            const action = shouldPreserveBio ? 'Updated (bio preserved)' : 'Cached';
            console.log(`[PersonCache] ${action} details for:`, details.name);
            return true;
        }
    } catch (err) {
        console.error('[PersonCache] Unexpected error caching details:', err);
        return false;
    }
};
