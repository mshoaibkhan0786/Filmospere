const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'YOUR_OMDB_API_KEY'; // Replace with your own key (e.g., from Patreon)
const TITLES = [
    // --- TOP RATED HOLLYWOOD (IMDb Top 250 & Classics) ---
    'The Shawshank Redemption', 'The Godfather', 'The Godfather Part II', 'The Dark Knight', '12 Angry Men',
    'Schindler\'s List', 'The Lord of the Rings: The Return of the King', 'Pulp Fiction',
    'The Lord of the Rings: The Fellowship of the Ring', 'The Good, the Bad and the Ugly', 'Forrest Gump',
    'Fight Club', 'The Lord of the Rings: The Two Towers', 'Inception', 'Star Wars: Episode V - The Empire Strikes Back',
    'The Matrix', 'Goodfellas', 'One Flew Over the Cuckoo\'s Nest', 'Se7en', 'Seven Samurai',
    'It\'s a Wonderful Life', 'The Silence of the Lambs', 'City of God', 'Saving Private Ryan',
    'Life Is Beautiful', 'The Green Mile', 'Interstellar', 'Star Wars: Episode IV - A New Hope',
    'Terminator 2: Judgment Day', 'Back to the Future', 'Spirited Away', 'Psycho', 'The Pianist',
    'Parasite', 'Leon: The Professional', ' The Lion King', 'Gladiator', 'American History X',
    'The Departed', 'The Usual Suspects', 'The Prestige', 'Casablanca', 'Whiplash', 'The Intouchables',
    'Modern Times', 'Once Upon a Time in the West', 'Hara-Kiri', 'Grave of the Fireflies',
    'Alien', 'Rear Window', 'City Lights', 'Memento', 'Apocalypse Now', 'Indiana Jones and the Raiders of the Lost Ark',
    'Django Unchained', 'WALL-E', 'The Lives of Others', 'Sunset Blvd.', 'Paths of Glory',
    'The Shining', 'The Great Dictator', 'Avengers: Infinity War', 'Witness for the Prosecution',
    'Aliens', 'American Beauty', 'The Dark Knight Rises', 'Dr. Strangelove', 'Spider-Man: Into the Spider-Verse',
    'Joker', 'Oldboy', 'Braveheart', 'Amadeus', 'Toy Story', 'Coco', 'Inglourious Basterds',
    'Das Boot', 'Avengers: Endgame', 'Princess Mononoke', 'Once Upon a Time in America',
    'Good Will Hunting', 'Requiem for a Dream', 'Toy Story 3', 'Your Name.', 'Singin\' in the Rain',
    '3 Idiots', 'Star Wars: Episode VI - Return of the Jedi', '2001: A Space Odyssey', 'Reservoir Dogs',
    'Eternal Sunshine of the Spotless Mind', 'Citizen Kane', 'Lawrence of Arabia', 'North by Northwest',
    'Vertigo', 'Amelie', 'A Clockwork Orange', 'Double Indemnity', 'Full Metal Jacket', 'Scarface',
    'Come and See', 'The Apartment', 'Taxidriver', 'To Kill a Mockingbird', 'The Sting',
    'Up', 'Heat', 'L.A. Confidential', 'Die Hard', 'Snatch', 'Monty Python and the Holy Grail',
    'Rashomon', 'For a Few Dollars More', 'Batman Begins', 'Downfall', 'Some Like It Hot',
    'The Kid', 'The Wolf of Wall Street', 'Green Book', 'Ran', 'The Truman Show', 'Casino',
    'Pan\'s Labyrinth', 'Howl\'s Moving Castle', 'A Beautiful Mind', 'The Secret in Their Eyes',
    'Lock, Stock and Two Smoking Barrels', 'Dial M for Murder', 'My Neighbor Totoro', 'V for Vendetta',
    'Trainspotting', 'The Gold Rush', 'Gone with the Wind', 'Raging Bull', 'Fargo', 'Inside Out',
    'Warrior', 'Gran Torino', 'The Elephant Man', 'Blade Runner', 'The Sixth Sense', 'The Thing',
    'No Country for Old Men', 'Finding Nemo', 'The Big Lebowski', 'Incendies', 'Kill Bill: Vol. 1',
    'Jurassic Park', 'Gone Girl', 'The Grand Budapest Hotel', 'Hacksaw Ridge', 'Cool Hand Luke',
    'Mary and Max', 'Amores Perros', 'Memories of Murder', 'Into the Wild', 'Million Dollar Baby',
    'Before Sunrise', 'Prisoners', 'Harry Potter and the Deathly Hallows: Part 2',
    'Catch Me If You Can', 'Persona', 'Life of Brian', 'How to Train Your Dragon',
    'Andrei Rublev', 'Mad Max: Fury Road', 'Network', 'Stand by Me', 'Platoon', 'Rush',
    'Logan', 'Hotel Rwanda', 'The 400 Blows', '12 Years a Slave', 'Spotlight', 'Ben-Hur',
    'Hachi: A Dog\'s Tale', 'The Best Years of Our Lives', 'Rocky', 'Monsters, Inc.',
    'Dead Poets Society', 'Barry Lyndon', 'La Haine', 'Pirates of the Caribbean: The Curse of the Black Pearl',
    'Groundhog Day', 'Paper Moon', 'The Grapes of Wrath', 'The Battle of Algiers', 'Harry Potter and the Prisoner of Azkaban',
    'Help!', 'Gandhi', 'Nausicaa of the Valley of the Wind', 'Donnie Darko', 'Before Sunset',

    // --- POPULAR WEB SERIES (Global) ---
    'Breaking Bad', 'Game of Thrones', 'Chernobyl', 'The Wire', 'Band of Brothers',
    'Avatar: The Last Airbender', 'The Sopranos', 'Rick and Morty', 'Sherlock', 'Fullmetal Alchemist: Brotherhood',
    'The Twilight Zone', 'Batman: The Animated Series', 'Arcane', 'Firefly', 'True Detective',
    'The Office', 'Death Note', 'Cowboy Bebop', 'Friends', 'Hunter x Hunter',
    'Seinfeld', 'Fargo', 'Attack on Titan', 'Better Call Saul', 'Gravity Falls',
    'Black Mirror', 'Stranger Things', 'Peaky Blinders', 'Narcos', 'House of Cards',
    'The Mandalorian', 'The Witcher', 'The Crown', 'Mindhunter', 'Dark', 'Ozark',
    'BoJack Horseman', 'Fleabag', 'Succession', 'Severance', 'Ted Lasso', 'The Boys',
    'Invincible', 'The Bear', 'Squid Game', 'Wednesday', 'The Last of Us', 'House of the Dragon',
    'Yellowstone', 'Westworld', 'Vikings', 'The Handmaid\'s Tale', 'This Is Us',
    'Brooklyn Nine-Nine', 'Parks and Recreation', 'Schitt\'s Creek', 'Modern Family',
    'How I Met Your Mother', 'The Big Bang Theory', 'Arrested Development', 'Community',
    'It\'s Always Sunny in Philadelphia', 'Curb Your Enthusiasm', 'Twin Peaks', 'Lost',
    'The X-Files', 'Doctor Who', 'Supernatural', 'Walking Dead', 'Dexter', 'Homeland',
    'Daredevil', 'The Punisher', 'Jessica Jones', 'Luke Cage', 'Iron Fist', 'Defenders',
    'Loki', 'WandaVision', 'Moon Knight', 'Andor', 'Ahsoka', 'Obi-Wan Kenobi',

    // --- INDIAN WEB SERIES & OTT HITS ---
    'Sacred Games', 'Mirzapur', 'Scam 1992: The Harshad Mehta Story', 'The Family Man',
    'Paatal Lok', 'Panchayat', 'Kota Factory', 'Aspirants', 'Gullak', 'Rocket Boys',
    'Made in Heaven', 'Delhi Crime', 'Asur: Welcome to Your Dark Side', 'Special OPS',
    'Farzi', 'Criminal Justice', 'Aarya', 'Breathe', 'Inside Edge', 'Little Things',
    'Permanent Roommates', 'TVF Pitchers', 'Tripling', 'Yeh Meri Family', 'Cubicles',
    'Hostel Daze', 'College Romance', 'Flames', 'Mismatched', 'She', 'Aranyak',
    'The Fame Game', 'Mai', 'Human', 'Grahan', 'Kaafir', 'Bandish Bandits',
    'Taj Mahal 1989', 'Jamtara: Sabka Number Ayega', 'Ghoul', 'Betaal', 'Bard of Blood',
    'Leila', 'Selection Day', 'Typewriter', 'Bombay Begums', 'Decoupled', 'Feels Like Ishq',
    'Ray', 'Lust Stories', 'Ghost Stories', 'Paava Kadhaigal', 'Kohrra', 'Scoop',
    'Jubilee', 'Dahaad', 'Saas, Bahu Aur Flamingo', 'Tooth Pari', 'Class', 'Trial by Fire',

    // --- BOLLYWOOD HITS (90s - Present) ---
    // Khans
    'Dilwale Dulhania Le Jayenge', 'Kuch Kuch Hota Hai', 'Kabhi Khushi Kabhie Gham', 'Kal Ho Naa Ho',
    'Veer-Zaara', 'My Name Is Khan', 'Swades', 'Chak De! India', 'Om Shanti Om', 'Main Hoon Na',
    'Chennai Express', 'Pathaan', 'Jawan', 'Dunki', 'Raees', 'Dear Zindagi', 'Dil To Pagal Hai',
    'Darr', 'Baazigar', 'Karan Arjun', 'Don', 'Don 2', 'Jab Tak Hai Jaan', 'Fan', 'Zero',
    'Bajrangi Bhaijaan', 'Sultan', 'Dabangg', 'Dabangg 2', 'Ek Tha Tiger', 'Tiger Zinda Hai',
    'Tiger 3', 'Kick', 'Bodyguard', 'Ready', 'Wanted', 'No Entry', 'Partner', 'Maine Pyar Kiya',
    'Hum Aapke Hain Koun', 'Hum Saath-Saath Hain', 'Andaaz Apna Apna', 'Judwaa', 'Biwi No.1',
    '3 Idiots', 'Dangal', 'PK', 'Lagaan', 'Rang De Basanti', 'Dil Chahta Hai', 'Taare Zameen Par',
    'Ghajini', 'Fanaa', 'Sarfarosh', 'Jo Jeeta Wohi Sikandar', 'Qayamat Se Qayamat Tak',
    'Talaash', 'Secret Superstar', 'Laal Singh Chaddha',

    // Other Stars
    'Zindagi Na Milegi Dobara', 'Rockstar', 'Barfi!', 'Yeh Jawaani Hai Deewani', 'Tamasha',
    'Sanju', 'Ae Dil Hai Mushkil', 'Brahmastra', 'Animal', 'Tu Jhoothi Main Makkaar',
    'Kabir Singh', 'Haider', 'Udta Punjab', 'Jab We Met', 'Kaminey', 'Vivah', 'Chup Chup Ke',
    'Gully Boy', 'Bajirao Mastani', 'Padmaavat', 'Ram-Leela', 'Dil Dhadakne Do', '83', 'Simmba',
    'Singham', 'Singham Returns', 'Sooryavanshi', 'Golmaal: Fun Unlimited', 'Golmaal Returns',
    'Golmaal 3', 'Drishyam', 'Drishyam 2', 'Tanhaji', 'Raid', 'Special 26', 'Baby', 'Airlift',
    'Rustom', 'Kesari', 'Mission Mangal', 'Pad Man', 'Toilet: Ek Prem Katha', 'OMG: Oh My God!',
    'OMG 2', 'Hera Pheri', 'Phir Hera Pheri', 'Bhool Bhulaiyaa', 'Bhool Bhulaiyaa 2', 'Welcome',
    'Munna Bhai M.B.B.S.', 'Lage Raho Munna Bhai', '3 Idiots', 'Vicky Donor', 'Piku',
    'Pink', 'Badla', 'Andhadhun', 'Article 15', 'Badhaai Ho', 'Dream Girl', 'Bala',
    'Stree', 'Bhediya', 'Munjya', 'Kantara', 'K.G.F: Chapter 1', 'K.G.F: Chapter 2',
    'Pushpa: The Rise', 'RRR', 'Baahubali: The Beginning', 'Baahubali 2: The Conclusion',
    'Salaar', 'Kalki 2898 AD', 'Leo', 'Jailer', 'Vikram', 'Kaithi', 'Master',
    'Ponniyin Selvan: I', 'Ponniyin Selvan: II', '2.0', 'Enthiran', 'Sivaji',
    'Kabali', 'Petta', 'Darbar', 'Annaatthe', 'Beast', 'Varisu', 'Thunivu',
    'Drishyam', 'Premam', 'Bangalore Days', 'Kumbalangi Nights', 'Take Off',
    'Trance', 'Minnal Murali', 'The Great Indian Kitchen', 'Joji', 'Malik',
    'Lucifer', 'Bheeshma Parvam', 'Kurup', 'Jana Gana Mana', 'Hridayam',

    // Recent & Upcoming Buzz
    'Fighter', 'Bade Miyan Chote Miyan', 'Merry Christmas', 'Sam Bahadur', '12th Fail',
    'Kho Gaye Hum Kahan', 'Archies', 'Khufiya', 'Jaane Jaan', 'Kathal',
    'Qala', 'Monica, O My Darling', 'Darlings', 'Gangubai Kathiawadi', 'Shamshera',
    'Prithviraj', 'Laal Singh Chaddha', 'Raksha Bandhan', 'Cuttputlli', 'Ram Setu',
    'Freddy', 'Govinda Naam Mera', 'Phone Bhoot', 'Bhediya', 'An Action Hero',
    'Uunchai', 'Drishyam 2', 'Cirkus', 'Shehzada', 'Selfiew', 'Tu Jhoothi Main Makkaar',
    'Bholaa', 'Gumraah', 'Kisi Ka Bhai Kisi Ki Jaan', 'Chengiz', 'Ponniyin Selvan 2',
    'Music School', 'Jogira Sara Ra Ra', 'Zara Hatke Zara Bachke', 'Adipurush', 'Maidaan',
    'Satyaprem Ki Katha', '72 Hoorain', 'Neeyat', 'Bawaal', 'Rocky Aur Rani Kii Prem Kahaani',
    'Gadar 2', 'OMG 2', 'Dream Girl 2', 'King of Kotha', 'Jawan', 'The Great Indian Family',
    'Sukhee', 'The Vaccine War', 'Fukrey 3', 'Mission Raniganj', 'Dhakaad',
    'Tejas', 'Ganapath', 'Tiger 3', 'Khichdi 2', 'Farrey', 'Sam Bahadur', 'Animal', 'Dunki',

    // --- GENRE SPECIFIC ---
    // Horror
    'The Conjuring', 'The Conjuring 2', 'Annabelle', 'Annabelle: Creation', 'The Nun',
    'Insidious', 'Sinister', 'Hereditary', 'Midsommar', 'It', 'It Chapter Two',
    'Get Out', 'Us', 'Nope', 'The Babadook', 'The Witch', 'A Quiet Place',
    'Saw', 'Scream', 'Halloween', 'The Exorcist', 'The Shining', 'Poltergeist',

    // Sci-Fi
    'Dune', 'Dune: Part Two', 'Arrival', 'Blade Runner 2049', 'Ex Machina',
    'The Martian', 'Gravity', 'Edge of Tomorrow', 'District 9', 'Looper',
    'Source Code', 'Moon', 'Her', 'Children of Men', 'Eternal Sunshine of the Spotless Mind',

    // Animation
    'Spider-Man: Across the Spider-Verse', 'Puss in Boots: The Last Wish', 'Encanto',
    'Soul', 'Luca', 'Turning Red', 'Raya and the Last Dragon', 'Moana', 'Zootopia',
    'Frozen II', 'Big Hero 6', 'Wreck-It Ralph', 'Tangled', 'Despicable Me',
    'Minions', 'Shrek', 'Shrek 2', 'Kung Fu Panda', 'How to Train Your Dragon',
    'The Incredibles', 'Ratatouille', 'Finding Nemo', 'Monsters, Inc.', 'Toy Story',
    'Up', 'WALL-E', 'Inside Out', 'Coco', 'Klaus', 'Wolfwalkers',

    // --- MORE CLASSICS & HITS TO REACH 1000+ ---
    // 80s/90s Action & Sci-Fi
    'Terminator', 'Predator', 'Predator 2', 'Commando', 'Total Recall', 'True Lies',
    'Rambo: First Blood', 'Rambo: First Blood Part II', 'Rambo III', 'Rocky II', 'Rocky III', 'Rocky IV', 'Rocky V', 'Rocky Balboa', 'Creed', 'Creed II', 'Creed III',
    'Bloodsport', 'Kickboxer', 'Universal Soldier', 'Hard Target',
    'Die Hard 2', 'Die Hard with a Vengeance', 'Live Free or Die Hard',
    'Lethal Weapon', 'Lethal Weapon 2', 'Lethal Weapon 3', 'Lethal Weapon 4',
    'RoboCop', 'RoboCop 2', 'Starship Troopers', 'The Fifth Element',
    'Independence Day', 'Men in Black', 'Men in Black II', 'Men in Black 3',
    'Armageddon', 'Deep Impact', 'Twister', 'Speed', 'Face/Off', 'Con Air', 'The Rock',

    // Comedy Hits
    'Dumb and Dumber', 'The Mask', 'Ace Ventura: Pet Detective', 'Ace Ventura: When Nature Calls', 'Liar Liar', 'Bruce Almighty', 'Yes Man',
    'Happy Gilmore', 'Billy Madison', 'The Waterboy', 'Big Daddy', 'Click', '50 First Dates', 'Grown Ups',
    'Zoolander', 'Tropic Thunder', 'Meet the Parents', 'Meet the Fockers', 'There\'s Something About Mary',
    'Anchorman: The Legend of Ron Burgundy', 'Step Brothers', 'Talladega Nights', 'Elf',
    'Superbad', 'Pineapple Express', 'This Is the End', 'The Hangover', 'The Hangover Part II', 'The Hangover Part III',
    'Bridesmaids', 'Mean Girls', 'Clueless', 'Legally Blonde', 'Pitch Perfect',

    // Horror / Thriller Classics
    'The Texas Chain Saw Massacre', 'Night of the Living Dead', 'Dawn of the Dead', 'Evil Dead', 'Evil Dead II', 'Army of Darkness',
    'The Thing', 'They Live', 'Escape from New York', 'Big Trouble in Little China',
    'A Nightmare on Elm Street', 'Friday the 13th', 'Child\'s Play', 'Candyman',
    'Hellraiser', 'The Ring', 'The Grudge', 'Scream 2', 'Scream 3', 'I Know What You Did Last Summer',
    'Misery', 'Carrie', 'The Mist', 'Pet Sematary',

    // More Animation & Family
    'Shrek the Third', 'Shrek Forever After', 'Madagascar', 'Madagascar: Escape 2 Africa', 'Madagascar 3: Europe\'s Most Wanted',
    'Kung Fu Panda 2', 'Kung Fu Panda 3', 'Ice Age', 'Ice Age: The Meltdown', 'Ice Age: Dawn of the Dinosaurs',
    'Despicable Me 2', 'Despicable Me 3', 'Sing', 'The Secret Life of Pets',
    'Aladdin', 'Beauty and the Beast', 'Mulan', 'Tarzan', 'Hercules', 'Pocahontas',
    'The Nightmare Before Christmas', 'Coraline', 'Corpse Bride', 'Frankenweenie',
    'My Neighbor Totoro', 'Kiki\'s Delivery Service', 'Castle in the Sky', 'Ponyo', 'Howl\'s Moving Castle',

    // Critically Acclaimed Drama / Indie
    'Moonlight', 'Lady Bird', 'Little Women', 'Call Me by Your Name', 'The Florida Project',
    'Uncut Gems', 'Good Time', 'The Lighthouse', 'A Ghost Story', 'Minari',
    'Nomadland', 'The Power of the Dog', 'Roma', 'Marriage Story', 'Manchester by the Sea',
    'Three Billboards Outside Ebbing, Missouri', 'The Shape of Water', 'Blue Jasmine',
    'Blue Valentine', 'Drive', 'Nightcrawler', 'Enemy', 'Prisoners', 'Sicario',
    'Arrival', 'Incendies', 'Polytechnique',

    // Indian Regional Hits (Tamil/Telugu/Malayalam that might be missing)
    'Mahanati', 'Jersey', 'Arjun Reddy', 'Rangasthalam', 'Magadheera', 'Eega',
    'Vedam', 'C/o Kancharapalem', 'Pelli Choopulu', 'Bommarillu',
    '96', 'Ratsasan', 'Thani Oruvan', 'Vada Chennai', 'Asuran', 'Karnan', 'Pariyerum Perumal',
    'Super Deluxe', 'Kaaka Muttai', 'Vikram Vedha',
    'Drishyam', 'Premam', 'Bangalore Days', 'Maheshinte Prathikaaram', 'Thondimuthalum Driksakshiyum',
    'Kumbalangi Nights', 'Virus', 'Android Kunjappan Version 5.25', 'Ayyappanum Koshiyum',
    'The Great Indian Kitchen', 'Joji', 'Nayattu', 'Minnal Murali',

    // Global TV Classics
    'Buffy the Vampire Slayer', 'Angel', 'Charmed', 'Smallville', 'Arrow', 'The Flash',
    'Supergirl', 'Legends of Tomorrow', 'Gotham', 'Agents of S.H.I.E.L.D.',
    'Star Trek: The Original Series', 'Star Trek: The Next Generation', 'Star Trek: Deep Space Nine',
    'Battlestar Galactica', 'Stargate SG-1', 'Doctor Who', 'Torchwood',
    'Downtown Abbey', 'Poldark', 'Outlander', 'Bridgerton',
    'Squid Game', 'All of Us Are Dead', 'Sweet Home', 'Alice in Borderland'
];

const fetchUrl = (url, retries = 3) => {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            if (retries > 0) {
                console.log(`    Network error (${e.code}), retrying... (${retries} attempts left)`);
                setTimeout(() => {
                    fetchUrl(url, retries - 1).then(resolve).catch(reject);
                }, 2000);
            } else {
                reject(e);
            }
        });
    });
};

const fetchMovie = (title) => {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`;
    return fetchUrl(url).then(parsed => {
        if (parsed.Response === 'False') {
            console.error(`Error fetching ${title}: ${parsed.Error}`);
            return null;
        }
        return parsed;
    }).catch(err => {
        console.error(`Failed to fetch ${title}:`, err.message);
        return null; // Return null on final failure to allow loop to continue
    });
};

const fetchSeason = (title, seasonNum) => {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&Season=${seasonNum}&apikey=${API_KEY}`;
    return fetchUrl(url).then(parsed => {
        if (parsed.Response === 'False') return null;
        return parsed;
    }).catch(() => null);
};

const fetchAllSeasons = async (title, totalSeasons) => {
    const seasons = [];
    const limit = Math.min(parseInt(totalSeasons) || 0, 15);
    console.log(`  Fetching ${limit} seasons for ${title}...`);

    for (let i = 1; i <= limit; i++) {
        const seasonData = await fetchSeason(title, i);
        if (seasonData && seasonData.Episodes) {
            seasons.push({
                seasonNumber: i,
                episodes: seasonData.Episodes.map(ep => ({
                    id: ep.imdbID,
                    title: ep.Title,
                    duration: 'N/A',
                    description: `Episode ${ep.Episode} of Season ${i}`,
                    releaseDate: ep.Released,
                    episodeNumber: parseInt(ep.Episode) || 0
                }))
            });
        }
        await new Promise(r => setTimeout(r, 200)); // Rate limiting
    }
    return seasons;
};

const mapToMovie = (omdbData, seasons = []) => {
    const isSeries = omdbData.Type === 'series';

    // Map Cast with Consistent IDs
    const cast = omdbData.Actors.split(', ').map((name) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return {
            id: `actor-${slug}`,
            name: name,
            role: 'Actor',
            imageUrl: ''
        };
    });

    return {
        id: `omdb-${omdbData.imdbID}`,
        title: omdbData.Title,
        releaseYear: parseInt(omdbData.Year) || new Date().getFullYear(),
        releaseDate: omdbData.Released,
        duration: omdbData.Runtime,
        posterUrl: omdbData.Poster !== 'N/A' ? omdbData.Poster : '',
        director: omdbData.Director,
        description: omdbData.Plot,
        rating: parseFloat(omdbData.imdbRating) || 0,
        voteCount: parseInt(omdbData.imdbVotes.replace(/,/g, '')) || 0,
        views: 0,
        tags: omdbData.Genre.split(', '),
        cast: cast,
        isCopyrightFree: false,
        streamingLinks: [],
        contentType: isSeries ? 'series' : 'movie',
        totalSeasons: isSeries ? omdbData.totalSeasons : undefined,
        language: omdbData.Language,
        languages: omdbData.Language.split(', '),
        boxOffice: omdbData.BoxOffice !== 'N/A' ? omdbData.BoxOffice : undefined,
        seasons: isSeries ? seasons : undefined
    };
};

const saveMovies = (movies, path) => {
    // Remove duplicates
    const uniqueMoviesMap = new Map();
    movies.forEach(m => uniqueMoviesMap.set(m.id, m));
    const uniqueMovies = Array.from(uniqueMoviesMap.values());

    const fileContent = `import type { Movie } from '../types';

export const omdbMovies: Movie[] = ${JSON.stringify(uniqueMovies, null, 4)};
`;
    fs.writeFileSync(path, fileContent);
    console.log(`Saved ${uniqueMovies.length} movies/series to file.`);
};

const main = async () => {
    console.log('Checking for existing data...');
    const outputPath = path.join(__dirname, '../src/data/omdbMovies.ts');
    let existingMovies = [];
    let existingTitles = new Set();

    if (fs.existsSync(outputPath)) {
        try {
            const content = fs.readFileSync(outputPath, 'utf-8');
            const match = content.match(/export const omdbMovies: Movie\[] = (\[[\s\S]*\]);/);
            if (match && match[1]) {
                const jsonStr = match[1].replace(/,(\s*])/g, '$1');
                existingMovies = JSON.parse(jsonStr);
                existingMovies.forEach(m => existingTitles.add(m.title.toLowerCase()));
                console.log(`Loaded ${existingMovies.length} existing movies.`);
            }
        } catch (error) {
            console.error('Error reading existing file, starting fresh.', error.message);
        }
    }

    const moviesToFetch = TITLES.filter(t => !existingTitles.has(t.toLowerCase()));
    console.log(`Found ${existingMovies.length} existing movies. Fetching ${moviesToFetch.length} new movies/series...`);

    // Work on a copy/buffer so we keep everything
    let allMoviesBuffer = [...existingMovies];

    for (let i = 0; i < moviesToFetch.length; i++) {
        const title = moviesToFetch[i];
        console.log(`[${i + 1}/${moviesToFetch.length}] Fetching ${title}...`);

        try {
            const data = await fetchMovie(title);
            if (data) {
                let seasons = [];
                if (data.Type === 'series') {
                    try {
                        seasons = await fetchAllSeasons(title, data.totalSeasons);
                    } catch (err) {
                        console.error(`Error fetching seasons for ${title}:`, err.message);
                    }
                }
                const movie = mapToMovie(data, seasons);
                allMoviesBuffer.push(movie);
            }
        } catch (err) {
            console.error(`Unexpected error for ${title}:`, err);
        }

        // Save every 20 items or at the end
        if ((i + 1) % 20 === 0 || i === moviesToFetch.length - 1) {
            saveMovies(allMoviesBuffer, outputPath);
        }

        await new Promise(r => setTimeout(r, 100));
    }

    // Final save
    saveMovies(allMoviesBuffer, outputPath);
};

main();
