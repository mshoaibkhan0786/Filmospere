import type { Movie } from '../types';

interface UserPreferences {
    genres: Record<string, number>;
    languages: Record<string, number>;
}

export const getUserPreferences = (): UserPreferences => {
    try {
        const storedGenres = localStorage.getItem('userGenrePreferences');
        const storedLangs = localStorage.getItem('userLanguagePreferences');
        return {
            genres: storedGenres ? JSON.parse(storedGenres) : {},
            languages: storedLangs ? JSON.parse(storedLangs) : {}
        };
    } catch {
        return { genres: {}, languages: {} };
    }
};

/**
 * Calculates a relevance score for a movie based on user history.
 * Base Score: Popularity (Views)
 * Bonuses:
 * - Matching Genre: +X points per visit
 * - Matching Language: +Y points per visit
 * - Release Year: Recency bias
 * - Sticky: High quality/Trending movies get a boost
 */
export const getMovieScore = (movie: Movie, prefs: UserPreferences): number => {
    let score = 0;

    // 1. Popularity Base (Normalized mostly)
    // Assuming views might be huge numbers, we scale log or just take a fraction
    // But we want personalization to override sheer popularity sometimes.
    score += (movie.views || 0) * 0.001;

    // 2. Language Match (High Priority)
    if (movie.language) {
        const langs = movie.language.split(',').map(l => l.trim());
        let langScore = 0;
        langs.forEach(l => {
            if (prefs.languages[l]) {
                langScore += prefs.languages[l] * 10; // +10 points per visit
            }
        });
        score += langScore;
    }

    // 3. Genre Match (Medium Priority)
    if (movie.tags) {
        let genreScore = 0;
        movie.tags.forEach(t => {
            if (prefs.genres[t]) {
                genreScore += prefs.genres[t] * 2; // +2 points per visit
            }
        });
        score += genreScore;
    }

    // 4. Recency (Freshness)
    const currentYear = new Date().getFullYear();
    if (movie.releaseYear === currentYear) {
        score += 20; // Fresh
    } else if (movie.releaseYear === currentYear - 1) {
        score += 10;
    }

    // 5. Rating/Sticky (Quality)
    if (movie.rating && movie.rating >= 8) {
        score += 15;
    } else if (movie.rating !== undefined && movie.rating < 5) {
        score -= 50; // Heavily penalize bad movies so they stay at bottom
    }

    // 6. Daily Rotation (Seeded Shuffle)
    // Use the current date as a seed so the shuffle is consistent for 24 hours.
    // This is better for SEO (stable snapshots) and UX (no disappearing items on refresh).
    const today = new Date();
    const seed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Simple pseudo-random function based on seed + movie ID length/char codes
    // (We use movie props to differ per movie, but consistently per day)
    // (We use movie props to differ per movie, but consistently per day)
    // Actually we want a hash function.

    const stringHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    // Combine Daily Seed + Movie ID
    const uniqueDayVal = stringHash((movie.id || '0') + seed.toString());
    const dailyBoost = (uniqueDayVal % 100) / 10; // Result: 0.0 to 9.9

    score += dailyBoost;

    return score;
};

export const getSmartSortedMovies = (movies: Movie[], prefs: UserPreferences): Movie[] => {
    // Clone array to avoid mutating original
    const pool = [...movies];

    // Calculate scores
    const scored = pool.map(m => ({
        movie: m,
        score: getMovieScore(m, prefs)
    }));

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Return just the movies
    return scored.map(item => item.movie);
};
