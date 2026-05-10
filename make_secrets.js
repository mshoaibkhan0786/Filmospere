const fs = require('fs');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env'));
const envLocal = dotenv.parse(fs.readFileSync('.env.local'));

const combined = { ...env, ...envLocal };
// Delete Vercel specific token
delete combined.VERCEL_OIDC_TOKEN;

// Ensure OpenAI is there
if (env.OPENAI_API_KEY) {
    combined.OPENAI_API_KEY = env.OPENAI_API_KEY;
}

fs.writeFileSync('cf_secrets.json', JSON.stringify(combined, null, 2));
