import { NextResponse } from 'next/server';

const INDEXNOW_KEY = '8cd68e7ac61e405a9689258925808819';
const INDEXNOW_HOST = 'filmospere.com';
const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;

export async function POST(request: Request) {
    try {
        // Optional: Simple secret check from header if needed, but for now open for admin use
        // const authHeader = request.headers.get('x-admin-key');
        // if (authHeader !== process.env.ADMIN_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { urls } = body;

        if (!urls || !Array.isArray(urls)) {
            return NextResponse.json({ error: 'Missing or invalid "urls" array' }, { status: 400 });
        }

        const payload = {
            host: INDEXNOW_HOST,
            key: INDEXNOW_KEY,
            keyLocation: INDEXNOW_KEY_LOCATION,
            urlList: urls
        };

        const response = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json({ error: `IndexNow API Error: ${response.status}`, details: text }, { status: response.status });
        }

        return NextResponse.json({ success: true, message: 'URLs submitted to IndexNow' });

    } catch (error) {
        console.error('IndexNow submission failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
