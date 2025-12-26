export const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const isValidUrl = (urlString: string) => {
    if (!urlString) return false;
    try {
        new URL(urlString);
        return true;
    } catch (e) {
        try {
            new URL('https://' + urlString);
            return true;
        } catch (e2) {
            return false;
        }
    }
};

export const isValidYoutubeUrl = (url: string) => {
    return isValidUrl(url) && (url.includes('youtube.com') || url.includes('youtu.be'));
};
