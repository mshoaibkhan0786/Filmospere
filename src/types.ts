export interface StreamingLink {
  platform: string;
  url: string;
  icon?: string;
  country?: string; // 'US', 'IN', 'GB', 'AU', etc.
  type?: 'flatrate' | 'rent' | 'buy' | 'free' | 'ads';
}

export interface Episode {
  id: string;
  title: string;
  duration: string;
  description: string;
  thumbnailUrl?: string;
  releaseDate?: string;
  episodeNumber?: number;
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface CastMember {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string; // YouTube URL or similar
  duration: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image_url?: string;
  author: string;
  category: string;
  tags?: string[];
  related_movie_id?: string;
  created_at: string;
  is_published: boolean;
  movie?: {
    slug: string;
  };
}

export interface PartialMovie {
  id: string;
  slug?: string;
  posterUrl: string;
  title: string;
  releaseDate?: string;
  rating: number;
  releaseYear: number;
  duration: string;
  tags: string[];
  isCopyrightFree: boolean;
  images?: string[]; // For Featured Hero banner
  description?: string; // For Featured Hero
  contentType?: 'movie' | 'series'; // For icon or routing
}

export interface Movie extends PartialMovie {
  // Extended details
  budget?: string; // Formatted budget
  boxOffice?: string; // Formatted box office
  status?: string; // e.g. 'Released', 'Post Production'
  tagline?: string;
  director: string;
  voteCount: number;
  views: number;
  hiddenTags?: string[];
  cast: CastMember[];
  trailerUrl?: string;
  streamingLinks: StreamingLink[];
  videoUrl?: string;
  language?: string;
  languages?: string[];
  seasons?: Season[];
  videos?: Video[];
  totalSeasons?: string;
  whyWatch?: string[];
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}
export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path?: string;
}

export interface ActorDetails {
  id: string; // The TMDB numeric ID string
  name: string;
  biography: string;
  birthday?: string;
  deathday?: string;
  place_of_birth?: string;
  profile_path?: string;
  images?: string[];
  known_for_department?: string;
  movie_credits?: {
    cast: {
      id: number;
      title: string;
      poster_path?: string;
      release_date?: string;
      character?: string;
    }[];
    crew?: CrewMember[];
  };
}
