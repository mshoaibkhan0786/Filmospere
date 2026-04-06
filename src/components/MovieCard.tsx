import React, { useState } from 'react';
import Link from 'next/link';

import type { Movie } from '../types';
import { Play, ImageOff, Star } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatDuration } from '../utils/formatUtils';

interface MovieCardProps {
    movie: Movie;
    onClick?: (movie: Movie) => void;
    priority?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, priority = false }) => {
    const [imgError, setImgError] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [imgSrc, setImgSrc] = useState(getOptimizedImageUrl(movie.posterUrl, 400));

    const handleError = () => {
        if (imgSrc !== movie.posterUrl) {
            setImgSrc(movie.posterUrl);
        } else {
            setImgError(true);
        }
    };

    const tags = movie.tags || [];
    const movieUrl = `/movie/${(movie.slug || movie.id).replace(/\s+/g, '-')}`;

    return (
        <Link
            href={movieUrl}
            className="movie-card group relative flex flex-col gap-2 w-full min-w-0 no-underline transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-110 hover:z-10 focus:scale-110 focus:z-10 outline-none"
            onClick={() => {
                if (onClick) onClick(movie);
            }}
        >
            <div className="w-full aspect-[2/3] relative bg-[#2a2a2a] rounded-lg overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.2)] group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-focus:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                {!imgError && movie.posterUrl ? (
                    <>
                        <img
                            ref={(el) => {
                                if (el && el.complete && !isImageLoaded) {
                                    setIsImageLoaded(true);
                                }
                            }}
                            src={imgSrc}
                            alt={movie.title || "Movie cover"}
                            width="400"
                            height="600"
                            loading={priority ? "eager" : "lazy"}
                            onLoad={() => setIsImageLoaded(true)}
                            onError={handleError}
                            className={`w-full h-full object-cover transition-all duration-500 ease-in-out group-hover:brightness-50 group-focus:brightness-50 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {!isImageLoaded && (
                            <div className="skeleton-shimmer absolute top-0 left-0 w-full h-full z-[1]" />
                        )}
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#333] to-[#111] flex items-center justify-center flex-col text-[#666]">
                        <ImageOff size={32} />
                    </div>
                )}

                <div
                    className="movie-card-overlay absolute bottom-0 left-0 w-full p-4 flex flex-col justify-end h-full box-border opacity-0 translate-y-2.5 group-hover:opacity-100 group-hover:translate-y-0 group-focus:opacity-100 group-focus:translate-y-0 transition-all duration-300 ease-in-out pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)' }}
                >
                    <div className="mb-3 flex items-center gap-2">
                        <div 
                            className="play-icon-circle w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
                            aria-label={`Play ${movie.title}`}
                        >
                            <Play size={16} fill="black" color="black" className="ml-[2px]" />
                        </div>
                        {movie.isCopyrightFree && (
                            <span className="text-[0.7rem] px-[6px] py-[2px] bg-white/20 rounded text-white">Free</span>
                        )}
                    </div>

                    <h3 className="m-0 mb-1 text-base text-white whitespace-nowrap overflow-hidden text-ellipsis">
                        {movie.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs font-bold mb-1">
                        <div className="flex items-center gap-1 text-[#e5b109]">
                            <Star size={12} fill="#e5b109" />
                            <span>{movie.rating ? Number(movie.rating).toFixed(1) : 'NR'}</span>
                        </div>
                        <span className="text-[#ccc]">{movie.releaseYear}</span>
                        {formatDuration(movie.duration) && formatDuration(movie.duration) !== '0 min' && formatDuration(movie.duration) !== 'N/A' && (
                            <>
                                <span className="text-[#666] text-[0.6rem]">•</span>
                                <span className="text-[#ccc]">{formatDuration(movie.duration)}</span>
                            </>
                        )}
                    </div>

                    <div className="movie-card-tags flex flex-wrap gap-1">
                        {tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[0.75rem] text-[#ccc]">
                                {tag}{i < Math.min(tags.length, 3) - 1 ? ' • ' : ''}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mobile-movie-info hidden px-[2px]">
                <h3 className="text-[0.9rem] text-white m-0 mb-1 whitespace-nowrap overflow-hidden text-ellipsis font-semibold">
                    {movie.title}
                </h3>
                <div className="flex items-center gap-[6px] text-[0.8rem] text-[#bbb]">
                    <div className="flex items-center gap-[3px] text-[#e5b109]">
                        <Star size={10} fill="#e5b109" />
                        <span>{movie.rating ? Number(movie.rating).toFixed(1) : 'NR'}</span>
                    </div>
                    <span>•</span>
                    <span>{movie.releaseYear}</span>
                </div>
            </div>
        </Link>
    );
};

export default MovieCard;
