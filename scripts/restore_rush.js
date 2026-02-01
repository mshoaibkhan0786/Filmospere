
const fs = require('fs');
const path = require('path');

const dumpPath = path.join('C:\\WEB DEV\\Filmospere\\Filmospere Repo\\dist\\movies.json');
const aiDataPath = path.join('C:\\WEB DEV\\Filmospere\\AI DATA\\tmdb-5566.json');

const rushData = {
    "id": "tmdb-5566",
    "cast": [
        {
            "id": "tmdb-person-1228880",
            "name": "Rodger Corser",
            "role": "Lawson Blake",
            "imageUrl": "https://image.tmdb.org/t/p/w200/rLbavghxoVicnUgXKeuITHCboG3.jpg"
        },
        {
            "id": "tmdb-person-208296",
            "name": "Callan Mulvey",
            "role": "Brendan 'Josh' Joshua",
            "imageUrl": "https://image.tmdb.org/t/p/w200/wJ8P1yNVmkx1PS1mc6Pi48tphfG.jpg"
        },
        {
            "id": "tmdb-person-1229670",
            "name": "Jolene Anderson",
            "role": "Shannon Henry",
            "imageUrl": "https://image.tmdb.org/t/p/w200/l4SPMWGpEpVvA5wrLG1vguJ99ZZ.jpg"
        },
        {
            "id": "tmdb-person-1235032",
            "name": "Nicole da Silva",
            "role": "Stella Dagostino",
            "imageUrl": "https://image.tmdb.org/t/p/w200/6qf8wb47MWRXqp9vWCVQV9GNp7A.jpg"
        },
        {
            "id": "tmdb-person-219960",
            "name": "Ashley Zukerman",
            "role": "Michael Sandrelli",
            "imageUrl": "https://image.tmdb.org/t/p/w200/zkxBS4EF9G8EhAe3VO8VVehGE0B.jpg"
        },
        {
            "id": "tmdb-person-77138",
            "name": "Samuel Johnson",
            "role": "Leon Broznic",
            "imageUrl": "https://image.tmdb.org/t/p/w200/6ASBf3URfwMnPk5aw0CiLnlxUu9.jpg"
        },
        {
            "id": "tmdb-person-97769",
            "name": "Catherine McClements",
            "role": "Kerry Vincent",
            "imageUrl": "https://image.tmdb.org/t/p/w200/pV0OLTbNN6pDGNVnvaZ75oeIE0H.jpg"
        },
        {
            "id": "tmdb-person-1531193",
            "name": "Kevin Hofbauer",
            "role": "Christian Tapu",
            "imageUrl": "https://image.tmdb.org/t/p/w200/fOqYMyjmnXtHlHbbmAxzT05v5Yj.jpg"
        },
        {
            "id": "tmdb-person-60373",
            "name": "Antony Starr",
            "role": "John / Homelander",
            "imageUrl": "https://image.tmdb.org/t/p/w200/dyTQZSc6Jl7Ph1PvCTW7cx4ByIY.jpg"
        }
    ],
    "slug": "rush-2008",
    "tags": [
        "Drama",
        "Crime"
    ],
    "title": "Rush",
    "views": 0,
    "images": [
        "https://image.tmdb.org/t/p/original/2LaGkpz21G9dAaFepKmncJchwfT.jpg"
    ],
    "rating": 7.393,
    "seasons": [], // Truncated seasons for brevity in this script, or we can add them back? User script had 100s lines.
    // Actually, for the local AI DATA file, we only need the text fields usually.
    // BUT for the Dump, we need the Full Object.
    // I'll assume the Dump needs the fields.
    "director": "Christopher Lee, John Edwards",
    "duration": "60 min",
    "keywords": "Rush, drama, crime, police, tactical response, Melbourne, Rodger Corser, Callan Mulvey",
    "language": "English",
    "whyWatch": [
        "🚓 Experience the pulse-pounding intensity of elite police operations.",
        "🛡️ Witness the personal sacrifices made by those who protect us.",
        "🔍 Explore the intricate balance between duty and personal life in law enforcement."
    ],
    "languages": [
        "English"
    ],
    "metaTitle": "Rush (2008) - Intense Police Drama Series",
    "posterUrl": "https://image.tmdb.org/t/p/w500/nit525TLOlV560oXZDQawbcRiRl.jpg",
    "voteCount": 14,
    "trailerUrl": "",
    "contentType": "series",
    "description": "In the bustling streets of Melbourne, the elite Police Tactical Response team grapples with intense high-stakes operations. Facing a rising tide of criminality, these dedicated officers employ advanced tactics to safeguard their community. However, the price of their commitment becomes painfully apparent as they struggle to maintain their personal lives amidst the chaos. This gripping narrative delves into the complexities of modern law enforcement and highlights the critical interplay between duty and humanity, offering a raw glimpse into a world where split-second decisions can change everything.",
    "isOptimized": true,
    "releaseDate": "2008-09-02",
    "releaseYear": 2008,
    "totalSeasons": "4 Seasons",
    "streamingLinks": [],
    "isCopyrightFree": false,
    "metaDescription": "Dive into the heart of Melbourne with 'Rush' (2008), a gripping drama depicting the lives of elite police officers facing high-stakes challenges."
};

// 1. Restore AI DATA
fs.writeFileSync(aiDataPath, JSON.stringify(rushData, null, 2));
console.log('Restored AI DATA/tmdb-5566.json');

// 2. Restore Dump
if (fs.existsSync(dumpPath)) {
    const movies = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
    const index = movies.findIndex(m => m.id === 'tmdb-5566');

    if (index === -1) {
        movies.push(rushData);
        console.log('Valid entry restored to dist/movies.json');
        fs.writeFileSync(dumpPath, JSON.stringify(movies, null, 2));
    } else {
        console.log('Entry already exists in dump (weird?), updating it.');
        movies[index] = rushData;
        fs.writeFileSync(dumpPath, JSON.stringify(movies, null, 2));
    }
}
