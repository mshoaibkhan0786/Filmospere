import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import { ArticleService } from '../services/ArticleService';
import type { Article } from '../types';
import { Helmet } from 'react-helmet-async';
import ArticleIndexSkeleton from '../components/ArticleIndexSkeleton'; // Assuming this component exists and is imported

const ArticlesIndexPage: React.FC = () => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadArticles = async () => {
            setIsLoading(true);
            const data = await ArticleService.getAllArticles(20);
            setArticles(data);
            setIsLoading(false);
        };
        loadArticles();
    }, []);

    const featuredArticle = articles.length > 0 ? articles[0] : null;
    const gridArticles = articles.length > 0 ? articles.slice(1) : [];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white' }}>
            <Helmet>
                <title>Articles | Filmospere</title>
                <meta name="description" content="Read the latest movie reviews, ending explained, and industry news on Filmospere." />
            </Helmet>

            <Navbar onSearch={(q) => navigate('/?search=' + q)} />

            <div className="container" style={{ padding: '80px 20px 40px', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header Removed to save space (moved to Logo) */}

                {isLoading ? (
                    <ArticleIndexSkeleton />
                ) : (
                    <>
                        {/* Featured Hero Article */}
                        {featuredArticle && (
                            <div style={{ marginBottom: '3rem' }}>
                                <ArticleCard article={featuredArticle} variant="hero" />
                            </div>
                        )}

                        {/* Recent Articles Grid */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', borderLeft: '4px solid #e50914', paddingLeft: '1rem' }}>
                                Recent Stories
                            </h2>
                        </div>

                        {gridArticles.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '2rem'
                            }}>
                                {gridArticles.map(article => (
                                    <div key={article.id} style={{ height: '100%' }}>
                                        <ArticleCard article={article} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            !featuredArticle && (
                                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#666' }}>
                                    <h3>No articles published yet.</h3>
                                    <p>Check back soon for fresh content!</p>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            <Footer />

            <style>
                {`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.6; }
                }
                @media (max-width: 768px) {
                    h1 { font-size: 2.5rem !important; }
                    .container { padding-left: 1rem !important; padding-right: 1rem !important; }
                }
            `}
            </style>
        </div>
    );
};

export default ArticlesIndexPage;
