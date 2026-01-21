import React from 'react';
import SectionHeader from '@/components/SectionHeader';

const SECTION_DESCRIPTIONS: Record<string, string> = {
    'Action': 'Adrenaline-pumping films featuring intense combat, chases, and heroic feats.',
    'Adventure': 'Epic journeys, exploration, and daring quests into the unknown.',
    'Comedy': 'Light-hearted stories designed to make you laugh and lift your spirits.',
    'Drama': 'Character-driven narratives exploring realistic themes and emotional depth.',
    'Horror': 'Spine-chilling tales designed to frighten, shock, and thrill.',
    'Sci-Fi': 'Futuristic concepts, advanced technology, and space exploration.',
    'Thriller': 'Suspenseful plots that keep you on the edge of your seat.',
    'Romance': 'Stories of love, relationships, and emotional connection.',
    'Animation': 'Creative and visually stunning stories for all ages.',
    'Fantasy': 'Magical worlds, mythical creatures, and supernatural elements.',
    'Mystery': 'Puzzling crimes, secrets, and whodunits waiting to be solved.',
    'Crime': 'Gritty narratives focusing on criminal acts and justice.',
    'Documentary': 'Real-life stories, factual records, and educational content.',
    'Family': 'Movies suitable for the entire family to enjoy together.',
    'Music': 'Films where music plays a central role in the storytelling.',
    'History': 'Dramatic depictions of historical events and figures.',
    'War': 'Intense and emotional stories set during times of conflict.',
    'Biography': 'Life stories of real people and their journeys.',
    'Sport': 'Inspirational stories centered around sports and athletes.',
    'Tollywood': 'The vibrant and action-packed cinema of the Telugu film industry.',
    'Bollywood': 'The colorful, musical, and dramatic world of Hindi cinema.',
    'Hollywood': 'Global blockbusters and critically acclaimed films from the US.',
    'Kollywood': 'The dynamic and diverse cinema of the Tamil film industry.',
    'Sandalwood': 'The rich and storytelling-focused cinema of the Kannada industry.',
    'Mollywood': 'The artistic and realistic cinema of the Malayalam industry.',
    'Pollywood': 'The lively and energetic cinema of the Punjabi film industry.',
    'Bengali Cinema': 'The intellectually stimulating and artistic cinema of Bengal.',
    'Marathi Cinema': 'The content-driven and culturally rich cinema of Maharashtra.',
    'K-Drama': 'Popular Korean television series known for emotional depth and style.',
    'Anime': 'Japanese animation known for colorful graphics and vibrant characters.',
    'Chinese Cinema': 'A diverse range of films from the Chinese-speaking world.',
    'English': 'A wide selection of English-language movies from around the world.',
    'Hindi': 'Popular movies in the Hindi language.',
    'Tamil': 'Popular movies in the Tamil language.',
    'Telugu': 'Popular movies in the Telugu language.',
    'Kannada': 'Popular movies in the Kannada language.',
    'Malayalam': 'Popular movies in the Malayalam language.',
    'Punjabi': 'Popular movies in the Punjabi language.',
    'Bengali': 'Popular movies in the Bengali language.',
    'Marathi': 'Popular movies in the Marathi language.',
    'Web Series': 'Binge-worthy episodic content across various genres.',
    'Latest Movies & Series': 'The newest releases fresh on the platform.',
    'Trending': 'What everyone is watching right now.',
    'Top Rated': 'The highest-rated movies and series of all time, ranked by our community and global scores.',
    'New Releases': 'The latest blockbusters and fresh episodes. Be the first to watch the newest content.',
    'Science Fiction': 'Futuristic concepts, advanced technology, and space exploration.'
};

export default async function Layout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ category: string }>;
}) {
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);
    const displayTitle = decodedCategory === 'web-series' ? 'Web Series' : decodedCategory;

    // Normalize title to match descriptions (Handle hyphens: top-rated -> top rated)
    const normalizedTitle = displayTitle.replace(/-/g, ' ');
    const matchedKey = Object.keys(SECTION_DESCRIPTIONS).find(k => k.toLowerCase() === normalizedTitle.toLowerCase());

    // Ensure display title is capitalized correctly based on our map
    const finalTitle = matchedKey || (normalizedTitle.charAt(0).toUpperCase() + normalizedTitle.slice(1));
    const description = SECTION_DESCRIPTIONS[finalTitle] || (matchedKey ? SECTION_DESCRIPTIONS[matchedKey] : '');

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', paddingBottom: '2rem' }}>
            <main className="container" style={{ marginTop: '2rem', paddingTop: '80px' }}>
                <SectionHeader title={finalTitle} description={description} />
                {children}
            </main>
        </div>
    );
}
