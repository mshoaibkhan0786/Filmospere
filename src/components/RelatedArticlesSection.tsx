'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getArticlesByMovieId } from '../lib/api';

interface Article {
    id: string;
    title: string;
    slug: string;
    image_url?: string;
}

interface RelatedArticlesSectionProps {
    movieId: string;
    movieTitle: string;
}

const RelatedArticlesSection: React.FC<RelatedArticlesSectionProps> = ({ movieId, movieTitle }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            if (!movieId) {
                setIsLoading(false);
                return;
            }

            try {
                const results = await getArticlesByMovieId(movieId);
                setArticles(results);
            } catch (err) {
                console.error('[RelatedArticles] Article fetch failed:', err);
                setArticles([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchArticles();
    }, [movieId, movieTitle]);

    if (isLoading || articles.length === 0) return null;

    return (
        <div style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                .read-article-text:hover {
                    color: white !important;
                }
            `}</style>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Related Articles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {articles.map(article => (
                    <Link
                        key={article.id}
                        href={`/articles/${article.slug}`}
                        className="related-article-link"
                        style={{ textDecoration: 'none', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                    >
                        {article.image_url && (
                            <div style={{ overflow: 'hidden', borderRadius: '4px', width: '60px', height: '60px', flexShrink: 0 }}>
                                <img
                                    src={article.image_url}
                                    alt={article.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        )}
                        <div>
                            <h4
                                style={{
                                    fontSize: '0.9rem',
                                    margin: '0 0 4px 0',
                                    lineHeight: '1.3',
                                    color: '#e5e5e5',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#e50914'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#e5e5e5'}
                            >
                                {article.title}
                            </h4>
                            <span className="read-article-text" style={{ fontSize: '0.75rem', color: '#888', transition: 'color 0.2s' }}>Read Article &rarr;</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RelatedArticlesSection;
