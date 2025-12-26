// This service will handle TMDB API integration in the future.
// Currently, we are using mock data in src/data/mockMovies.ts.

const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';
const BASE_URL = 'https://api.themoviedb.org/3';

const getHeaders = () => ({
    accept: 'application/json',
    Authorization: `Bearer ${TMDB_READ_TOKEN}`
});

export const fetchTrendingMovies = async () => {
    try {
        const response = await fetch(`${BASE_URL}/trending/movie/week`, { headers: getHeaders() });
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        return [];
    }
};

export const searchMovies = async (query: string) => {
    try {
        const response = await fetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}`, { headers: getHeaders() });
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error searching movies:', error);
        return [];
    }
};

export const searchPerson = async (query: string) => {
    try {
        const response = await fetch(`${BASE_URL}/search/person?query=${encodeURIComponent(query)}`, { headers: getHeaders() });
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error searching person:', error);
        return [];
    }
};

export const fetchPersonDetails = async (id: number | string) => {
    try {
        const response = await fetch(`${BASE_URL}/person/${id}?append_to_response=images,movie_credits`, { headers: getHeaders() });
        if (!response.ok) return null;
        const data = await response.json();

        // Transform images to simple array of paths
        const images = data.images?.profiles?.map((p: any) => p.file_path) || [];

        return {
            ...data,
            images // Override with simple array for compatibility
        };
    } catch (error) {
        console.error('Error fetching person details:', error);
        return null;
    }
};
