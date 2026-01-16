const https = require('https');

const API_KEY = '8cd68e7ac61e405a9689258925808819';
const HOST = 'filmospere.com';
const URLS_TO_SUBMIT = [
    'https://filmospere.com/',
    'https://filmospere.com/articles',
    'https://filmospere.com/section/trending',
    'https://filmospere.com/section/web-series',
    'https://filmospere.com/section/latest%20movies%20%26%20series'
];

const data = JSON.stringify({
    host: HOST,
    key: API_KEY,
    keyLocation: `https://${HOST}/${API_KEY}.txt`,
    urlList: URLS_TO_SUBMIT
});

const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': data.length
    }
};

const req = https.request(options, res => {
    console.log(`StatusCode: ${res.statusCode}`);
    if (res.statusCode === 200 || res.statusCode === 202) {
        console.log('✅ Success: URLs submitted to IndexNow');
    } else {
        console.log('❌ Error: Start submission failed.');
    }

    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
