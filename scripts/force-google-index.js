const { google } = require('googleapis');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

// Configuration
const KEY_FILE_PATH = path.join(__dirname, '..', 'security-key.json');
const SITEMAP_URL = 'https://filmospere.com/sitemap-movies-1.xml'; 

// Function to fetch the sitemap and grab URLs
async function fetchLatestUrls() {
    try {
        console.log(`Fetching sitemap from ${SITEMAP_URL}...`);
        const response = await fetch(SITEMAP_URL);
        const xml = await response.text();
        
        // Match all <loc> tags
        const urlMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
        let urls = urlMatches.map(match => match[1]);
        
        // Shuffle the array so we index different URLs every day
        for (let i = urls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [urls[i], urls[j]] = [urls[j], urls[i]];
        }
        
        // Google Indexing API allows max 200 requests per batch/day for new accounts
        const urlsToSubmit = urls.slice(0, 200);
        console.log(`Found ${urls.length} URLs in sitemap. Randomly selecting 200 for today.`);
        return urlsToSubmit;
    } catch (error) {
        console.error('Error fetching sitemap:', error);
        return [];
    }
}

async function submitToGoogle() {
    console.log('--- Google Indexing API Push ---');
    
    // 1. JWT Authentication
    let authClient;
    try {
        let key;
        if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
            key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
            console.log('Using authentication from Environment Variable...');
        } else {
            key = require(KEY_FILE_PATH);
            console.log('Using authentication from local service-account.json...');
        }

        authClient = new google.auth.JWT({
            email: key.client_email,
            key: key.private_key,
            scopes: ['https://www.googleapis.com/auth/indexing']
        });
        await authClient.authorize();
        console.log('✅ Authenticated with Google Cloud Service Account successfully.');
    } catch (err) {
        console.error('❌ Authentication failed. Make sure service-account.json exists or GOOGLE_SERVICE_ACCOUNT_JSON is set.');
        console.error(err.message);
        process.exit(1);
    }

    // 2. Fetch URLs
    const urls = await fetchLatestUrls();
    if (urls.length === 0) {
        console.log('No URLs found. Exiting.');
        return;
    }

    // 3. Submit URLs individually to Indexing API
    let successCount = 0;
    let failCount = 0;

    console.log(`Starting submission of ${urls.length} URLs...`);
    
    for (const url of urls) {
        try {
            const urlPayload = {
                url: url,
                type: 'URL_UPDATED',
            };

            await authClient.request({
                method: 'POST',
                url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
                data: urlPayload,
                headers: { 'Content-Type': 'application/json' }
            });

            console.log(`✅ Pushed: ${url}`);
            successCount++;
            
            // Sleep slightly to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`❌ Failed: ${url} -`, error.message);
            failCount++;
        }
    }

    console.log('\n--- Submission Report ---');
    console.log(`Successfully pushed: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log('Remember: You must add the service account email as an "Owner" in Google Search Console for this to work!');
}

submitToGoogle();
