import { config } from 'dotenv';
config({ path: '.env.local' });
import { getPersonById, getMoviesByPersonId } from '../src/lib/api';

async function test() {
    console.log('Testing person fetch...');
    try {
        const id = 'austin-abrams-148992';
        const person = await getPersonById(id);
        console.log('Person:', person ? person.name : 'null');
        
        const movies = await getMoviesByPersonId(id);
        console.log('Movies:', movies.length);
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
