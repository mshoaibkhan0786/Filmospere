import axios from 'axios';

const urls = [
    'https://image.tmdb.org/t/p/original/ctiRpS16dlaTXQBSsiFncMrgWmh.jpg', // Found in DB logs
    'https://image.tmdb.org/t/p/original/52fe4423c3a36847f80866ef.jpg', // Poster hash?
];

async function checkUrls() {
    console.log('Testing URLs...');

    for (const url of urls) {
        try {
            const response = await axios.head(url);
            console.log(`[${response.status}] ${url} - SUCCESS`);
        } catch (error: any) {
            console.log(`[${error.response?.status || 'ERR'}] ${url} - FAILED`);
        }
    }
}

checkUrls();
