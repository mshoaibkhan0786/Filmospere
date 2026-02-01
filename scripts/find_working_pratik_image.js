
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';

async function findWorkingImage() {
    // Pratik Gandhi ID: 1779934
    // Check his person images endpoint directly
    const url = 'https://api.themoviedb.org/3/person/1779934/images';

    try {
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${TMDB_READ_TOKEN}`,
                accept: 'application/json'
            }
        });

        const data = await res.json();
        const profiles = data.profiles || [];

        console.log(`Found ${profiles.length} profile images for Pratik.`);

        // Check each one
        for (const p of profiles) {
            const imgUrl = `https://image.tmdb.org/t/p/original${p.file_path}`;
            const check = await fetch(imgUrl, { method: 'HEAD' });
            if (check.ok) {
                console.log(`✅ WORKING: ${p.file_path}`);
            } else {
                console.log(`❌ DEAD: ${p.file_path}`);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

findWorkingImage();
