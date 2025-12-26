
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env:', result.error);
} else {
    console.log('✅ .env loaded');
    const keys = Object.keys(result.parsed || {});
    keys.forEach(k => {
        const val = result.parsed[k];
        console.log(`${k}: ${val ? val.substring(0, 5) + '...' : 'EMPTY'}`);
    });
}
