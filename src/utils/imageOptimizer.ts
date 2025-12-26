
/**
 * Optimizes an image URL for display using a public image proxy (wsrv.nl).
 * This allows for resizing, compression, and WebP format conversion on the fly.
 * 
 * @param url The source image URL.
 * @param width The desired width (default: 300px for cards).
 * @param quality The desired quality (0-100, default: 80).
 * @returns The optimized image URL or the original if it cannot be optimized (e.g. data URLs).
 */
export const getOptimizedImageUrl = (url: string, width: number = 300, quality: number = 80): string => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;

    // Handle partial TMDB paths (e.g. "/path/to/image.jpg")
    if (url.startsWith('/')) {
        url = `https://image.tmdb.org/t/p/original${url}`;
    }

    // TMDB Optimization: Use native TMDB CDN sizes
    // Available widths: w92, w154, w185, w342, w500, w780, original
    if (url.includes('image.tmdb.org')) {
        let tmdbSize = 'original';
        if (width <= 92) tmdbSize = 'w92';
        else if (width <= 154) tmdbSize = 'w154';
        else if (width <= 185) tmdbSize = 'w185';
        else if (width <= 342) tmdbSize = 'w342';
        else if (width <= 500) tmdbSize = 'w500';
        else if (width <= 780) tmdbSize = 'w780';

        // Replace current size part of path (e.g. /original/ or /w500/) with optimized size
        // This handles cases where url is already https://image.tmdb.org/t/p/original/xfw...
        return url.replace(/\/t\/p\/[^\/]+\//, `/t/p/${tmdbSize}/`);
    }

    // Avoid double-proxying
    if (url.includes('wsrv.nl')) return url;

    try {
        const encodedUrl = encodeURIComponent(url);
        return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&q=${quality}&output=webp`;
    } catch (e) {
        console.error('Failed to optimize image URL:', e);
        return url;
    }
};
