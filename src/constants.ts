export const MAIN_CATEGORIES = [
    'Action',
    'Adventure',
    'Animation',
    'Comedy',
    'Crime',
    'Documentary',
    'Drama',
    'Family',
    'Fantasy',
    'Horror',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Thriller'
];

export const PLATFORM_LOGOS: Record<string, string> = {
    'Netflix': 'https://cdn.simpleicons.org/netflix/E50914',
    'Amazon Prime Video': 'https://cdn.simpleicons.org/amazon/00A8E1',
    'Disney+': 'https://cdn.simpleicons.org/disneyplus/FFFFFF',
    'Hulu': 'https://cdn.simpleicons.org/hulu/1CE783',
    'HBO Max': 'https://cdn.simpleicons.org/hbo/FFFFFF',
    'Apple TV+': 'https://cdn.simpleicons.org/apple/FFFFFF',
    'YouTube Premium': 'https://cdn.simpleicons.org/youtube/FF0000',
    'Google Play Movies': 'https://cdn.simpleicons.org/googleplay/FFFFFF',
};

export const PLATFORM_THEMES: Record<string, { color: string; logo: string; textColor?: string }> = {
    'Netflix': {
        color: '#000000',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg'
    },
    'Amazon Prime Video': {
        color: '#00A8E1',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg'
    },
    'Disney+': {
        color: '#113CCF',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg'
    },
    'Hulu': {
        color: '#1CE783', // Hulu Green
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg',
        textColor: 'black'
    },
    'HBO Max': {
        color: '#5d26c1', // HBO Purple/Gradient
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg'
    },
    'Apple TV+': {
        color: '#000000',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg'
    },
    'YouTube Premium': {
        color: '#FF0000',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg',
    },
    'JioCinema': {
        color: '#D41F77',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/JioCinema_Logo.svg/1200px-JioCinema_Logo.svg.png' // Fallback to High-Res PNG
    },
    'Hotstar': {
        color: '#0C1E4F',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Disney%2B_Hotstar_logo.svg'
    },
    'Zee5': {
        color: '#8230C6',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Zee5_logo.svg'
    },
    'SonyLIV': {
        color: '#F37021',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Sony_LIV_2020_Logo.svg'
    },
    'Peacock': {
        color: '#000000',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/NBCUniversal_Peacock_Logo.svg'
    },
    'Paramount+': {
        color: '#0064FF',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Paramount%2B_logo.svg'
    },
    'Tubi': {
        color: '#202020',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Tubi_logo.svg'
    },
    'Crunchyroll': {
        color: '#F47521',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Crunchyroll_Logo_2018.svg'
    },
    'Discovery+': {
        color: '#202020',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Discovery%2B.svg'
    }
};
