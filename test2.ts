import { config } from 'dotenv';
config({path:'.env.local'});
import { getPersonById, getMoviesByPersonId } from './src/lib/api';
Promise.all([getPersonById('carmen-ruiz-1143886'), getMoviesByPersonId('carmen-ruiz-1143886')]).then(([p,m]) => console.log('Person:', p?p.name:'null', 'Movies:', m.length)).catch(console.error);
