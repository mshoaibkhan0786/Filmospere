'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article } from '../types';
import { formatDate } from '../utils/formatUtils';

interface ArticleCardProps {
    article: Article;
    variant?: 'default' | 'hero' | 'compact';
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = 'default' }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Compact Variant (Sidebar Style - Small Horizontal)
    if (variant === 'compact') {
        return (
            <Link
                href={`/articles/${article.slug}`}
                style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center', // Center vertically
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: '12px',
                    backgroundColor: '#1f1f1f',
                    border: '1px solid #333',
                    transition: 'all 0.2s ease',
                    height: '100%',
                    transform: isHovered ? 'translateY(-2px)' : 'none',
                    boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                    borderColor: isHovered ? '#444' : '#333'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Small Thumbnail */}
                <div style={{
                    width: '120px',
                    height: '80px',
                    flexShrink: 0,
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <Image
                        src={article.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                        alt={article.title}
                        fill
                        sizes="120px"
                        style={{
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                            transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                        }}
                        unoptimized={true}
                    />
                </div>

                {/* Compact Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#e50914',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                        letterSpacing: '0.5px'
                    }}>
                        {article.category}
                    </div>
                    <h4 style={{
                        margin: '0 0 0.25rem 0',
                        fontSize: '1rem',
                        lineHeight: '1.3',
                        color: 'white',
                        fontWeight: 600,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {article.title}
                    </h4>
                    <div style={{
                        fontSize: '0.8rem',
                        color: '#888',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span>{formatDate(article.created_at)}</span>
                    </div>
                </div>
            </Link>
        );
    }

    // Hero Variant (Big Feature)
    if (variant === 'hero') {
        return (
            <Link
                href={`/articles/${article.slug}`}
                style={{
                    textDecoration: 'none',
                    display: 'block',
                    position: 'relative',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    height: '500px',
                    color: 'white',
                    boxShadow: isHovered
                        ? '0 30px 60px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.1)'
                        : '0 20px 50px rgba(0,0,0,0.5)',
                    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    border: isHovered ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Background Image */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${article.image_url || 'https://via.placeholder.com/1200x600?text=No+Image'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'top center',
                    transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.4s ease',
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                    filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
                }} />

                {/* Gradient Overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, #141414 0%, rgba(20,20,20,0.8) 40%, rgba(0,0,0,0.2) 100%)',
                    transition: 'opacity 0.4s ease',
                    opacity: 1
                }} />

                {/* Content */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    padding: '3rem',
                    zIndex: 2
                }}>
                    <span style={{
                        backgroundColor: '#e50914',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '50px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        display: 'inline-block',
                        textTransform: 'uppercase'
                    }}>
                        {article.category}
                    </span>
                    <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        lineHeight: 1.2,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        {article.title}
                    </h2>
                    <p style={{
                        fontSize: '1.1rem',
                        color: '#cccccc',
                        maxWidth: '80%',
                        marginBottom: '1.5rem',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {article.excerpt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', color: '#999' }}>
                        <span>by <span style={{ color: 'white' }}>{article.author}</span></span>
                        <span>•</span>
                        <span>{formatDate(article.created_at)}</span>
                    </div>
                </div>
            </Link>
        );
    }

    // Default Card (Grid)
    return (
        <Link
            href={`/articles/${article.slug}`}
            style={{
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: '#1f1f1f',
                border: '1px solid #333',
                transition: 'all 0.3s ease',
                height: '100%',
                transform: isHovered ? 'translateY(-5px)' : 'none',
                boxShadow: isHovered ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
                borderColor: isHovered ? '#444' : '#333'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image */}
            <div style={{
                height: '200px',
                width: '100%',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <Image
                    src={article.image_url || 'https://via.placeholder.com/600x400?text=No+Image'}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    style={{
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                    }}
                    unoptimized={true}
                />
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    zIndex: 2
                }}>
                    {article.category}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '0.75rem',
                    lineHeight: 1.4
                }}>
                    {article.title}
                </h3>
                <p style={{
                    fontSize: '0.95rem',
                    color: '#aaa',
                    lineHeight: 1.6,
                    marginBottom: '1.5rem',
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {article.excerpt}
                </p>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    color: '#666',
                    marginTop: 'auto'
                }}>
                    <span>{formatDate(article.created_at)}</span>
                    <span style={{
                        color: isHovered ? '#e50914' : '#666',
                        fontWeight: 600,
                        transition: 'color 0.3s'
                    }}>
                        Read More →
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default ArticleCard;
