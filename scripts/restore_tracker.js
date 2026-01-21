const fs = require('fs');
const path = require('path');

const TRACKER_FILE = path.join(__dirname, '../.agent/pinterest_tracker.json');

// Movie IDs corresponding to the 10 duplicates:
// The Martian: 286217
// Gone Girl: 210577
// Money Heist: 71446
// Zootopia: 269149
// Whiplash: 244786
// Jigarthanda: 242582
// Vaastav: 42684
// Ziggy Stardust: 33909
// Gloomy Sunday: 28876
// The Revenant: 281957
// The Nice Guys: 290250 (already in file? let's check unique)
// GGS: 1111956
// Ligaw: 1186716 

// Note: I will add these IDs. Some might be duplicates, Set will handle it.
const restoreIds = [
    "tmdb-286217", // The Martian
    "tmdb-210577", // Gone Girl
    "tmdb-71446",  // Money Heist
    "tmdb-269149", // Zootopia
    "tmdb-244786", // Whiplash
    "tmdb-242582", // Jigarthanda 
    "tmdb-42684",  // Vaastav
    "tmdb-33909",  // Ziggy Stardust
    "tmdb-28876",  // Gloomy Sunday
    "tmdb-281957", // The Revenant
    "tmdb-290250", // The Nice Guys
    "tmdb-1111956", // GGS
    "tmdb-1186716" // Ligaw
];

function restoreTracker() {
    let currentIds = [];
    if (fs.existsSync(TRACKER_FILE)) {
        currentIds = JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
    }

    // Merge and Deduplicate
    const combinedSet = new Set([...currentIds, ...restoreIds]);
    const finalIds = Array.from(combinedSet);

    fs.writeFileSync(TRACKER_FILE, JSON.stringify(finalIds, null, 2));
    console.log(`Restored missing IDs. Total tracked movies: ${finalIds.length}`);
}

restoreTracker();
