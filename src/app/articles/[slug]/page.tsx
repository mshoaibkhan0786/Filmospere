
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticleBySlug, getAllArticles } from '../../../lib/api';

import RichTextRenderer from '../../../components/RichTextRenderer';
import ArticleSkeleton from '../../../components/ArticleSkeleton';
import { formatDate } from '../../../utils/formatUtils';
import ShareButtons from '../../../components/ShareButtons';
import ArticleCard from '../../../components/ArticleCard';

type Props = {
    params: Promise<{ slug: string }>
};

// SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { slug } = await params;
        const article = await getArticleBySlug(slug);

        if (!article) {
            return {
                title: 'Article Not Found | Filmospere',
            };
        }

        const title = `${article.title} | Filmospere`;
        const description = article.excerpt || article.title;
        const image = article.image_url || '/filmospere-social.png';

        return {
            title,
            description,
            openGraph: {
                title: article.title,
                description,
                images: [image],
                type: 'article',
                publishedTime: article.created_at,
                authors: [article.author]
            },
            twitter: {
                card: 'summary_large_image',
                title: article.title,
                description,
                images: [image],
            }
        };
    } catch (e) {
        console.error('generateMetadata failed for ArticlePage:', e);
        return {
            title: 'Error - Filmosphere',
        };
    }
}

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;
    const articlePromise = getArticleBySlug(slug);
    const recentArticlesPromise = getAllArticles(4); // Fetch 4 to ensure we have 3 after filtering

    const [article, recentArticles] = await Promise.all([articlePromise, recentArticlesPromise]);

    if (!article) {
        notFound();
    }

    const isSpecialArticle = article.slug === 'hidden-gems-like-the-unhappiest-man-in-town';

    // Filter out current article from recent articles
    const moreArticles = recentArticles
        .filter(a => a.id !== article.id)
        .slice(0, 3);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white' }}>


            <article style={{ marginTop: '0' }} className={isSpecialArticle ? 'special-article' : ''}>
                {/* Hero Image */}
                <div style={{
                    width: '100%',
                    height: '60vh',
                    maxHeight: '600px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${article.image_url || 'https://via.placeholder.com/1200x600?text=No+Image'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'top center',
                        filter: 'brightness(0.6)'
                    }} />

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
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
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
                    padding: '3rem 20px 1.5rem'
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

                    <div className="article-content-wrapper">
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
                                href={`/movie/${article.movie?.slug || article.related_movie_id}`}
                                className="view-details-btn"
                                style={{
                                    backgroundColor: 'white',
                                    color: 'black',
                                    padding: '10px 24px',
                                    borderRadius: '50px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    transition: 'transform 0.2s ease',
                                    display: 'inline-block'
                                }}
                            >
                                View Details
                            </Link>
                        </div>
                    )}

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                        <div style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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

                    <ShareButtons title={article.title} />

                </div>
            </article>

            {/* Read More Section */}
            {moreArticles.length > 0 && (
                <div style={{ backgroundColor: '#0a0a0a', padding: '1.5rem 0 4rem 0' }}>
                    <div className="container">
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '2rem',
                            borderLeft: '4px solid #e50914',
                            paddingLeft: '1rem'
                        }}>
                            More to Read
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '1.5rem',
                            margin: '0'
                        }}>
                            {moreArticles.map(a => (
                                <ArticleCard key={a.id} article={a} variant="compact" />
                            ))}
                        </div>
                    </div>
                </div>
            )}



            <style>{`
                @media (max-width: 768px) {
                    h1 { font-size: 2.2rem !important; }
                }
                .view-details-btn:hover {
                    transform: scale(1.05);
                }
                
                /* Special styling for specific lists */
                .special-article .article-content {
                    font-family: 'Georgia', serif; 
                    color: #d1d1d1;
                    line-height: 1.8;
                    font-size: 1.15rem;
                }
                .special-article .article-content h2 {
                    font-family: 'Inter', sans-serif;
                    border-left: 4px solid #e50914;
                    padding-left: 1rem;
                    margin: 3rem 0 1.5rem;
                    color: white; 
                }
                .special-article .article-content p {
                    margin-bottom: 1.5rem; 
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
}
