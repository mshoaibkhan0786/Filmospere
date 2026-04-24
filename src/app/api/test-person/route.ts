import { NextResponse } from 'next/server';
import { getPersonById, getMoviesByPersonId } from '../../../lib/api';

export async function GET() {
    try {
        const id = 'austin-abrams-148992';
        const personData = await getPersonById(id);
        const movies = await getMoviesByPersonId(id);
        
        return NextResponse.json({ personData, movies: movies.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
