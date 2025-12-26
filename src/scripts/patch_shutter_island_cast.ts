
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CORRECT_ROLES: Record<string, string> = {
    'Leonardo DiCaprio': 'Teddy Daniels',
    'Mark Ruffalo': 'Chuck Aule',
    'Ben Kingsley': 'Dr. Cawley',
    'Max von Sydow': 'Dr. Naehring',
    'Michelle Williams': 'Dolores Chanal',
    'Emily Mortimer': 'Rachel Solando',
    'Patricia Clarkson': 'Rachel Solando',
    'Jackie Earle Haley': 'George Noyce',
    'Ted Levine': 'Warden',
    'John Carroll Lynch': 'Deputy Warden McPherson',
    'Elias Koteas': 'Andrew Laeddis',
    'Robin Bartlett': 'Bridget Kearns',
    'Christopher Denham': 'Peter Breene'
};

async function patchCast() {
    const movieId = 'tmdb-11324';
    console.log(`Fetching movie ${movieId}...`);

    const { data: movie, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', movieId)
        .single();

    if (error || !movie) {
        console.error('Error fetching movie:', error);
        return;
    }

    const movieData = movie.data;

    if (!movieData.cast || !Array.isArray(movieData.cast)) {
        console.error('No cast array found');
        return;
    }

    console.log('Current Cast Roles (First 5):');
    movieData.cast.slice(0, 5).forEach((c: any) => console.log(`- ${c.name}: ${c.role}`));

    // Patch roles
    let updatedCount = 0;
    const updatedCast = movieData.cast.map((member: any) => {
        if (CORRECT_ROLES[member.name]) {
            if (member.role !== CORRECT_ROLES[member.name]) {
                console.log(`Updating ${member.name}: "${member.role}" -> "${CORRECT_ROLES[member.name]}"`);
                updatedCount++;
                return { ...member, role: CORRECT_ROLES[member.name] };
            }
        }
        return member;
    });

    if (updatedCount === 0) {
        console.log('No roles needed updating.');
        return;
    }

    // Update DB
    const { error: updateError } = await supabase
        .from('movies')
        .update({
            data: { ...movieData, cast: updatedCast }
        })
        .eq('id', movieId);

    if (updateError) {
        console.error('Failed to update movie:', updateError);
    } else {
        console.log('Successfully updated cast roles!');
    }
}

patchCast();
