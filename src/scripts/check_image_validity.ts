
// Native fetch used


async function main() {
    const url = "https://image.tmdb.org/t/p/original/8Vt6mNqx4qv3k5Yt1uHqhGkZ6y.jpg";
    try {
        const res = await fetch(url);
        console.log(`URL: ${url}`);
        console.log(`Status: ${res.status}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);
        console.log(`Size: ${res.headers.get('content-length')}`);
    } catch (e) {
        console.error('Error fetching image:', e);
    }
}

main();
