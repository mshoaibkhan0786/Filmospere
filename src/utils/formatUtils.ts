export const formatDuration = (duration: string | number | undefined): string => {
    if (duration === undefined || duration === null || duration === 'N/A') return 'N/A';

    // Ensure it's a string for processing
    const durStr = String(duration);

    // If it contains "Season", return as is (e.g. "1 Season", "2 Seasons")
    if (durStr.toLowerCase().includes('season')) {
        return durStr;
    }

    let minutes = 0;

    // Check for "Xh Ym" or "Xh" format first
    const hmMatch = durStr.match(/(\d+)h\s*(\d*)m?/i);
    if (hmMatch) {
        const h = parseInt(hmMatch[1], 10);
        const m = parseInt(hmMatch[2] || '0', 10);
        minutes = h * 60 + m;
    } else {
        // Parse "130 min" or just "130"
        const match = durStr.match(/(\d+)\s*min/i);
        if (match) {
            minutes = parseInt(match[1], 10);
        } else {
            // Handle raw number (e.g. 130) or string number ("130")
            const parsed = parseInt(durStr, 10);
            if (!isNaN(parsed)) {
                minutes = parsed;
            } else {
                return durStr; // Return original if unknown format
            }
        }
    }

    if (isNaN(minutes)) return durStr;

    // Only convert if >= 60 minutes
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (mins === 0) {
            return `${hours}h`;
        }
        return `${hours}h ${mins}m`;
    }

    // If it was just a number or "X min", render as "X min" if < 60
    return `${minutes}m`;
};

export const formatDate = (dateString: string | undefined): string => {
    if (!dateString || dateString === 'N/A') return 'N/A';

    // Try parsing the date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if parsing fails

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

export const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString || dateString === 'N/A') return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatVoteCount = (count: number): string => {
    if (count >= 1000) {
        // 1500 -> 1.5k, 10000 -> 10k
        return parseFloat((count / 1000).toFixed(1)) + 'k';
    }
    return count.toString();
};

export const getDurationInMinutes = (duration: string | undefined): number => {
    if (!duration || duration === 'N/A') return 0;

    // Check for "Xh Ym" or "Xh" format
    const hmMatch = duration.match(/(\d+)h\s*(\d*)m?/i);
    if (hmMatch) {
        const h = parseInt(hmMatch[1], 10);
        const m = parseInt(hmMatch[2] || '0', 10);
        return h * 60 + m;
    }

    // Format "130 min"
    const match = duration.match(/(\d+)\s*min/i);
    if (match) {
        return parseInt(match[1], 10);
    }

    // Fallback: try parsing start of string
    const num = parseInt(duration, 10);
    if (!isNaN(num)) return num;

    return 0;
};

export const isValidContent = (content: { duration?: string; posterUrl?: string }): boolean => {
    const validDuration = getDurationInMinutes(content.duration) >= 15;
    const validPoster = !!content.posterUrl && content.posterUrl !== 'N/A' && content.posterUrl.trim() !== '';
    return validDuration && validPoster;
};

export const formatLanguage = (languageCode: string | undefined): string => {
    if (!languageCode || languageCode === 'N/A') return 'N/A';

    const languageMap: { [key: string]: string } = {
        'en': 'English',
        'hi': 'Hindi',
        'ta': 'Tamil',
        'te': 'Telugu',
        'ml': 'Malayalam',
        'kn': 'Kannada',
        'bn': 'Bengali',
        'mr': 'Marathi',
        'gu': 'Gujarati',
        'pa': 'Punjabi',
        'ur': 'Urdu',
        'fr': 'French',
        'es': 'Spanish',
        'de': 'German',
        'ja': 'Japanese',
        'zh': 'Chinese',
        'ko': 'Korean',
        'ru': 'Russian',
        'it': 'Italian',
        'pt': 'Portuguese',
        'th': 'Thai',
        'id': 'Indonesian',
        'tr': 'Turkish',
        'ar': 'Arabic'
    };

    const nativeToLatinMap: { [key: string]: string } = {
        'हिन्दी': 'Hindi',
        'தமிழ்': 'Tamil',
        'తెలుగు': 'Telugu',
        'മലയാളം': 'Malayalam',
        'ಕನ್ನಡ': 'Kannada',
        'বাংলা': 'Bengali',
        'मराठी': 'Marathi',
        'ગુજરાતી': 'Gujarati',
        'ਪੰਜਾਬੀ': 'Punjabi',
        'اردو': 'Urdu',
        '日本語': 'Japanese',
        '한국어': 'Korean',
        '中文': 'Chinese',
        'Русский': 'Russian',
        'Français': 'French',
        'Español': 'Spanish',
        'Deutsch': 'German',
        'Italiano': 'Italian',
        'Português': 'Portuguese'
    };

    // Split by comma if multiple languages are present
    const codes = languageCode.split(',').map(code => code.trim().toLowerCase());

    const formattedLanguages = codes.map(code => {
        // 1. Check ISO Map
        if (languageMap[code]) return languageMap[code];

        // 2. Check Native Map (handling case sensitivity)
        // Try exact match first, then capitalize
        /* NOTE: logic above lowercases everything. Native scripts usually don't have case, but let's be safe */
        /* Actually, 'codes' splits by comma and lowercase. Non-latin often unchanged by toLowerCase(). */
        /* But native maps keys above are capitalized/normal. */

        // We need to match case-insensitive against our keys? 
        // Iterate or just check common variations?
        // Simpler: revert the lowercasing for the value lookup if possible, or just look up directly.
        // Since we lowercased 'code' via `code.trim().toLowerCase()`:
        // 'हिन्दी'.toLowerCase() is 'हिन्दी'.

        // Let's iterate if not found (expensive?) or just check keys.
        // Better: Make nativeToLatinMap usage robust.

        const foundNative = Object.keys(nativeToLatinMap).find(key => key.toLowerCase() === code);
        if (foundNative) return nativeToLatinMap[foundNative];

        // 3. Fallback: Capitalize
        return code.charAt(0).toUpperCase() + code.slice(1);
    });

    return formattedLanguages.join(', ');
};

export const createSlug = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-');  // Replace multiple - with single -
};

export const extractIdFromSlug = (slug: string): string => {
    // Extract the last numeric part
    const match = slug.match(/-?(\d+)$/) || slug.match(/^(\d+)$/);
    return match ? match[1] : slug;
};

