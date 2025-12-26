import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RichTextRenderer from '../components/RichTextRenderer';
import { ArticleService } from '../services/ArticleService';
import type { Article } from '../types';
import { formatDate } from '../utils/formatUtils';
import ArticleSkeleton from '../components/ArticleSkeleton';

const ArticlePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = useState<Article | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadArticle = async () => {
            if (!slug) return;
            setIsLoading(true);
            const data = await ArticleService.getArticleBySlug(slug);
            setArticle(data);
            setIsLoading(false);
        };
        loadArticle();
        window.scrollTo(0, 0);
    }, [slug]);

    if (isLoading) return <ArticleSkeleton />;

    if (!article) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white', display: 'flex', flexDirection: 'column' }}>
                <Navbar onSearch={() => { }} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <h1>Article Not Found</h1>
                    <Link to="/articles" style={{ color: '#e50914', marginTop: '1rem' }}>Back to Articles</Link>
                </div>
            </div>
        );
    }

    const isSpecialArticle = article.slug === 'hidden-gems-like-the-unhappiest-man-in-town';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white' }}>
            <Helmet>
                <title>{article.excerpt || article.title} | Filmospere</title>
                <meta name="description" content={article.excerpt} />
                <meta property="og:image" content={article.image_url} />
                <meta property="og:title" content={article.title} />
                <meta property="og:type" content="article" />
            </Helmet>

            <Navbar onSearch={(q) => navigate('/?search=' + q)} showBackArrow={true} />

            <article style={{ marginTop: '0' }} className={isSpecialArticle ? 'special-article' : ''}>
                {/* Hero Image */}
                <div style={{
                    width: '100%',
                    height: '60vh',
                    maxHeight: '600px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <img
                        src={article.image_url}
                        alt={article.title}
                        referrerPolicy="no-referrer"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'top center',
                            filter: 'brightness(0.6)'
                        }}
                        onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/1200x600?text=No+Image';
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, #141414 0%, transparent 60%)'
                    }} />

                    <div className="container" style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingBottom: '2rem',
                        maxWidth: '1000px',
                        margin: '0 auto',
                        zIndex: 10
                    }}>
                        <h1 style={{
                            marginTop: '0.5rem',
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)', // Responsive font size
                            fontWeight: 800,
                            lineHeight: '1.2',
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                            marginBottom: '1rem',
                            letterSpacing: '-0.02em',
                            textAlign: 'center'
                        }}>
                            {article.title}
                        </h1>

                        <div style={{
                            position: 'absolute',
                            bottom: '2rem',
                            right: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '0.9rem',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>
                            <img
                                src={`https://ui-avatars.com/api/?name=${article.author}&background=333&color=fff`}
                                alt={article.author}
                                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                            />
                            <div>
                                <div style={{ color: 'white', fontWeight: 600 }}>{article.author}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{formatDate(article.created_at)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="container" style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '3rem 20px 6rem'
                }}>

                    {/* Subtitle / Excerpt */}
                    {article.excerpt && !article.content.trim().startsWith('#') && (
                        <p style={{
                            fontSize: isSpecialArticle ? '1.25rem' : '2rem',
                            lineHeight: '1.3',
                            color: '#ffffff',
                            textAlign: 'left',
                            marginBottom: '2rem',
                            fontWeight: 700,
                            maxWidth: '100%',
                            borderLeft: isSpecialArticle ? 'none' : '4px solid #e50914',
                            paddingLeft: isSpecialArticle ? '0' : '1rem'
                        }}>
                            {article.excerpt}
                        </p>
                    )}

                    <div className="article-content">
                        <RichTextRenderer content={article.content} />
                    </div>

                    {article.related_movie_id && !isSpecialArticle && (
                        <div style={{
                            marginTop: '4rem',
                            marginBottom: '2rem',
                            padding: '1.5rem',
                            backgroundColor: '#1f1f1f',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid #333'
                        }}>
                            <div>
                                <h4 style={{ margin: 0, color: '#999', fontSize: '0.9rem', textTransform: 'uppercase' }}>Like this article?</h4>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginTop: '0.25rem' }}>
                                    Know more about the movie
                                </div>
                            </div>
                            <Link
                                to={`/movie/${article.movie?.slug || article.related_movie_id}`}
                                className="view-details-btn"
                                style={{
                                    backgroundColor: 'white',
                                    color: 'black',
                                    padding: '10px 24px',
                                    borderRadius: '50px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    transition: 'transform 0.2s ease'
                                }}
                            >
                                View Details
                            </Link>
                        </div>
                    )}

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                        <div style={{ marginTop: '4rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {article.tags.map(tag => (
                                <span key={tag} style={{
                                    backgroundColor: '#2a2a2a',
                                    color: '#ccc',
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    fontSize: '0.9rem'
                                }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </article>
            <Footer />

            <style>{`
                @media (max-width: 768px) {
                    h1 { font-size: 2.2rem !important; }
                }
                .view-details-btn:hover {
                    transform: scale(1.05);
                }
                
                /* Special styling for specific lists */
                .special-article .article-content {
                    font-family: 'Georgia', serif; /* Explicitly force Serif */
                    color: #d1d1d1; /* Standard article grey */
                    line-height: 1.8; /* Match standard article pacing */
                    font-size: 1.15rem; /* Match standard article size */
                }
                .special-article .article-content h2 {
                    font-family: 'Inter', sans-serif; /* Restore Sans-Serif for headers */
                    border-left: 4px solid #e50914;
                    padding-left: 1rem;
                    margin: 3rem 0 1.5rem; /* Standard H2 spacing */
                    color: white; /* Ensure headings stay white */
                }
                .special-article .article-content p {
                    margin-bottom: 1.5rem; /* Standard paragraph spacing */
                }

                /* Injected Movie Images */
                .article-movie-image {
                    width: 100%;
                    border-radius: 12px;
                    margin: 1.5rem 0 1rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                    transition: transform 0.3s ease;
                }
                .article-movie-image:hover {
                    transform: scale(1.02);
                }

                /* CTA Buttons */
                .movie-cta-container {
                    margin: 2rem 0 3rem;
                    display: flex;
                    justify-content: flex-start;
                }
                .movie-cta-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    background-color: #e50914;
                    color: white !important; /* Force override generic link color */
                    padding: 12px 28px;
                    border-radius: 50px;
                    font-weight: 700;
                    text-decoration: none !important;
                    font-family: 'Inter', sans-serif;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                    transition: all 0.2s ease;
                    font-size: 1rem;
                }
                .movie-cta-button:hover {
                    background-color: #ff0a16;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.5);
                }
                .movie-cta-button .play-icon {
                    font-size: 1.2rem;
                }
            `}</style>
        </div>
    );
};

export default ArticlePage;
