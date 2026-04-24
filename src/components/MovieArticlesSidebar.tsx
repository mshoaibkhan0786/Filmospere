import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getArticlesByMovieId } from '../lib/api';

interface Props {
    movieId: string;
}

export default async function MovieArticlesSidebar({ movieId }: Props) {
    const articles = await getArticlesByMovieId(movieId);

    if (!articles || articles.length === 0) return null;

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
                            <div style={{ overflow: 'hidden', borderRadius: '4px', width: '60px', height: '60px', flexShrink: 0, position: 'relative' }}>
                                <Image
                                    src={article.image_url}
                                    alt={article.title}
                                    fill
                                    sizes="60px"
                                    style={{ objectFit: 'cover' }}
                                    unoptimized={true}
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
}
