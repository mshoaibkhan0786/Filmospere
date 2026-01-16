
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

    // 1. Handle partial TMDB paths (e.g. "/path/to/image.jpg") -> Resolve to full URL first
    let fullUrl = url;
    if (url.startsWith('/')) {
        fullUrl = `https://image.tmdb.org/t/p/original${url}`;
    }

    // 2. Prevent Double Proxying
    if (fullUrl.includes('wsrv.nl')) return fullUrl;

    // 3. WS.RV Logic (The Free Global CDN)
    // We use this for EVERYTHING now to bypass Vercel's processing limits.
    // It is fast, free, and supports WebP/AVIF.
    try {
        const encodedUrl = encodeURIComponent(fullUrl);
        // "af" = adaptive format (serves WebP/AVIF automatically based on browser)
        // "l" = compression level (default is usually good, but we pass q)
        return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&q=${quality}&output=webp`;
    } catch (e) {
        console.error('Failed to optimize image URL:', e);
        return fullUrl;
    }
};
