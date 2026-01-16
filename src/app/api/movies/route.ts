import { NextRequest, NextResponse } from 'next/server';
import { getMoviesByTag, searchMovies } from '@/lib/api';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag');
    const query = searchParams.get('query'); // For search
    const start = parseInt(searchParams.get('start') || '0', 10);
    const count = parseInt(searchParams.get('count') || '20', 10);

    // Route: Search
    if (query) {
        const { results } = await searchMovies(query, start, count);
        return NextResponse.json(results);
    }

    // Route: Tag/Section
    if (tag) {
        const movies = await getMoviesByTag(tag, start, count);
        return NextResponse.json(movies);
    }

    return NextResponse.json([]);
}
