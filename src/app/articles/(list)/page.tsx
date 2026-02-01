
import { Metadata } from 'next';
import { getAllArticles } from '../../../lib/api';
import ArticleCard from '../../../components/ArticleCard';


export const metadata: Metadata = {
    title: 'Articles - Filmospere',
    description: 'Read the latest movie reviews, ending explained, and industry news on Filmospere.',
    alternates: {
        canonical: 'https://filmospere.com/articles'
    }
};

// Revalidate every hour
export const revalidate = 3600;

export default async function ArticlesIndexPage() {
    const articles = await getAllArticles(20);

    const featuredArticle = articles.length > 0 ? articles[0] : null;
    const gridArticles = articles.length > 0 ? articles.slice(1) : [];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white', display: 'flex', flexDirection: 'column' }}>


            <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>

                {/* SEO H1 */}
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Latest Articles</h1>

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
            </div>



            <style>{`
                @media (max-width: 768px) {
                    h1 { font-size: 2.5rem !important; }
                    .container { padding-left: 1rem !important; padding-right: 1rem !important; }
                }
            `}</style>
        </div>
    );
}
