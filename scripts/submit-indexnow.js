const https = require('https');

const API_KEY = '8cd68e7ac61e405a9689258925808819';
const HOST = 'filmospere.com';
const SITEMAP_URL = 'https://filmospere.com/sitemap-movies-1.xml';

async function submitIndexNow() {
    try {
        console.log(`Fetching sitemap from ${SITEMAP_URL}...`);
        
        // Polyfill fetch for node environments without raw Node fetch
        const response = await fetch(SITEMAP_URL);
        const xml = await response.text();
        
        const urlMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
        let sitemapUrls = urlMatches.map(match => match[1]);
        
        // Add static URLs too
        sitemapUrls.unshift(
            'https://filmospere.com/',
            'https://filmospere.com/articles',
            'https://filmospere.com/section/trending',
            'https://filmospere.com/section/web-series',
            'https://filmospere.com/section/latest%20movies%20%26%20series'
        );

        // IndexNow limits to 10,000 URLs per request
        const urlsToSubmit = sitemapUrls.slice(0, 10000);
        console.log(`Prepared ${urlsToSubmit.length} URLs for IndexNow submission.`);

        const data = JSON.stringify({
            host: HOST,
            key: API_KEY,
            keyLocation: `https://${HOST}/${API_KEY}.txt`,
            urlList: urlsToSubmit
        });

        const options = {
            hostname: 'api.indexnow.org',
            port: 443,
            path: '/indexnow',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, res => {
            console.log(`StatusCode: ${res.statusCode}`);
            if (res.statusCode === 200 || res.statusCode === 202) {
                console.log('✅ Success: URLs submitted to IndexNow');
            } else {
                console.log('❌ Error: Submission failed.');
            }

            res.on('data', d => {
                process.stdout.write(d);
            });
        });

        req.on('error', error => {
            console.error('Request Error:', error);
        });

        req.write(data);
        req.end();
    } catch (e) {
        console.error('Failed to submit to IndexNow:', e);
    }
}

submitIndexNow();
