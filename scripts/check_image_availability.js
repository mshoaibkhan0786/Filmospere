
async function checkImages() {
    const images = [
        'https://image.tmdb.org/t/p/original/xO3r3j74kYj6a9b.jpg', // Pratik
        'https://image.tmdb.org/t/p/original/8IF24mMUSspmXHbxCMMbMaz3WRj.jpg', // Hemant
        'https://image.tmdb.org/t/p/original/zS7K5mX8.jpg'  // Shreya
    ];

    console.log('Checking TMDB image availability...');

    for (const url of images) {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            console.log(`${res.status} ${res.statusText} - ${url}`);
        } catch (e) {
            console.error(`ERROR: ${e.message} - ${url}`);
        }
    }
}

checkImages();
