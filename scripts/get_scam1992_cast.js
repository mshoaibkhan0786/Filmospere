
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';

async function getCast() {
    // Scam 1992 ID is 111188 (TV Series)
    const url = 'https://api.themoviedb.org/3/tv/111188/credits?language=en-US';

    try {
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${TMDB_READ_TOKEN}`,
                accept: 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`Failed: ${res.statusText}`);
        }

        const data = await res.json();
        const cast = data.cast;

        // Print formatted JSON-like output for top cast
        console.log('--- FOUND CAST ---');
        cast.slice(0, 15).forEach(c => {
            console.log(`Name: ${c.name}, ID: ${c.id}, Path: ${c.profile_path}`);
        });

    } catch (e) {
        console.error(e);
    }
}

getCast();
