
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Article } from '../../types';
import { Plus, Edit2, Trash2, Eye, FileText } from 'lucide-react';
import { ArticleService } from '../../services/ArticleService';

const AdminArticlesPage: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchArticles = async () => {
        setIsLoading(true);
        // Fetch ALL articles for admin, not just published
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching articles:', error);
        } else {
            setArticles((data as Article[]) || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const handleDelete = async (slug: string) => {
        if (window.confirm('Are you sure you want to delete this article? This cannot be undone.')) {
            const success = await ArticleService.deleteArticle(slug);
            if (success) {
                setArticles(articles.filter(a => a.slug !== slug));
            } else {
                alert('Failed to delete article');
            }
        }
    };

    if (isLoading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '4rem' }}>Loading articles...</div>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Articles</h1>
                <Link
                    to="/admin/articles/new"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#e50914',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontWeight: 600
                    }}
                >
                    <Plus size={20} />
                    Create New Article
                </Link>
            </div>

            <div style={{ backgroundColor: '#111', borderRadius: '8px', border: '1px solid #333', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #333', backgroundColor: '#1a1a1a' }}>
                            <th style={{ padding: '1rem', color: '#999', fontSize: '0.9rem', fontWeight: 600 }}>TITLE</th>
                            <th style={{ padding: '1rem', color: '#999', fontSize: '0.9rem', fontWeight: 600 }}>AUTHOR</th>
                            <th style={{ padding: '1rem', color: '#999', fontSize: '0.9rem', fontWeight: 600 }}>STATUS</th>
                            <th style={{ padding: '1rem', color: '#999', fontSize: '0.9rem', fontWeight: 600 }}>DATE</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#999', fontSize: '0.9rem', fontWeight: 600 }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.map((article) => (
                            <tr key={article.id} style={{ borderBottom: '1px solid #222', transition: 'background-color 0.2s' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600, color: 'white' }}>{article.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>/{article.slug}</div>
                                </td>
                                <td style={{ padding: '1rem', color: '#ccc' }}>
                                    {article.author}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        backgroundColor: article.is_published ? 'rgba(46, 204, 113, 0.2)' : 'rgba(241, 196, 15, 0.2)',
                                        color: article.is_published ? '#2ecc71' : '#f1c40f'
                                    }}>
                                        {article.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: '#888', fontSize: '0.9rem' }}>
                                    {new Date(article.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#888',
                                                cursor: 'pointer',
                                                padding: '6px'
                                            }}
                                            title="View Public Page"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <Link
                                            to={`/admin/articles/edit/${article.slug}`}
                                            style={{
                                                display: 'inline-block',
                                                color: '#3498db',
                                                padding: '6px'
                                            }}
                                            title="Edit Article"
                                        >
                                            <Edit2 size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(article.slug)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#e74c3c',
                                                cursor: 'pointer',
                                                padding: '6px'
                                            }}
                                            title="Delete Article"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {articles.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                                    <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <div>No articles found</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminArticlesPage;
