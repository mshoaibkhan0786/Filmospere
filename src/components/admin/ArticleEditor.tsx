"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import type { Article } from '../../types';
import RichTextRenderer from '../RichTextRenderer';
import { Save, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';

interface ArticleEditorProps {
    initialArticle?: Article | null;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ initialArticle }) => {
    const router = useRouter();
    const isEditing = !!initialArticle;

    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState(initialArticle?.title || '');
    const [articleSlug, setArticleSlug] = useState(initialArticle?.slug || '');
    const [author, setAuthor] = useState(initialArticle?.author || 'Admin');
    const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || '');
    const [content, setContent] = useState(initialArticle?.content || '');
    const [imageUrl, setImageUrl] = useState(initialArticle?.image_url || '');
    const [tags, setTags] = useState(initialArticle?.tags ? initialArticle.tags.join(', ') : '');
    const [isPublished, setIsPublished] = useState(typeof initialArticle?.is_published === 'boolean' ? initialArticle.is_published : true);
    const [relatedMovieId, setRelatedMovieId] = useState(initialArticle?.related_movie_id || '');

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        // Auto-generate slug only if crafting new article or if slug hasn't been manually touched (simple heuristic)
        if (!isEditing) {
            setArticleSlug(newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
        }
    };

    const handleSave = async () => {
        if (!title || !articleSlug) {
            alert('Title and Slug are required');
            return;
        }

        setIsSaving(true);
        const articleData: Partial<Article> = {
            title,
            slug: articleSlug,
            author,
            excerpt,
            content,
            image_url: imageUrl,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            is_published: isPublished,
            related_movie_id: relatedMovieId || undefined,
            category: 'Article' // Default
        };

        let result;
        if (isEditing && initialArticle?.slug) {
            // Update
            const { data, error } = await supabase
                .from('articles')
                .update(articleData)
                .eq('slug', initialArticle.slug) // Use original slug to find the record
                .select()
                .single();

            if (error) {
                console.error('Error updating article:', error);
                alert('Failed to update article');
            } else {
                result = data;
                alert('Article updated successfully!');
                router.push('/admin/articles');
            }
        } else {
            // Create
            const { data, error } = await supabase
                .from('articles')
                .insert([articleData])
                .select()
                .single();

            if (error) {
                console.error('Error creating article:', error);
                alert('Failed to create article');
            } else {
                result = data;
                alert('Article created successfully!');
                router.push('/admin/articles');
            }
        }
        setIsSaving(false);
    };

    return (
        <div style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
            {/* Header / Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/admin/articles" style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                        {isEditing ? 'Edit Article' : 'New Article'}
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={isPublished}
                            onChange={e => setIsPublished(e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                        />
                        Publish immediately
                    </label>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#e50914',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '4px',
                            border: 'none',
                            fontWeight: 600,
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            opacity: isSaving ? 0.7 : 1
                        }}
                    >
                        <Save size={20} />
                        {isSaving ? 'Saving...' : 'Save Article'}
                    </button>
                </div>
            </div>

            {/* Split View Container */}
            <div style={{ flex: 1, display: 'flex', gap: '2rem', overflow: 'hidden' }}>

                {/* Editor Column (Scrollable) */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Metadata Section */}
                    <div style={{ backgroundColor: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#ccc', fontSize: '1rem', fontWeight: 600 }}>Metadata</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={handleTitleChange}
                                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px', fontSize: '1rem' }}
                                placeholder="Article Title"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Slug</label>
                                <input
                                    type="text"
                                    value={articleSlug}
                                    onChange={e => setArticleSlug(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Author</label>
                                <input
                                    type="text"
                                    value={author}
                                    onChange={e => setAuthor(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Tags (Comma separated)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                                placeholder="Classic, Drama, Satire"
                            />
                        </div>
                    </div>

                    {/* Media Section */}
                    <div style={{ backgroundColor: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#ccc', fontSize: '1rem', fontWeight: 600 }}>Media & Links</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Cover Image URL (Backdrop)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    style={{ flex: 1, padding: '0.75rem', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                                    placeholder="https://image.tmdb.org/t/p/original/..."
                                />
                                {imageUrl && (
                                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #444' }}>
                                        <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Related Movie ID (Optional)</label>
                            <input
                                type="text"
                                value={relatedMovieId}
                                onChange={e => setRelatedMovieId(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                                placeholder="UUID of related movie"
                            />
                        </div>
                    </div>

                    {/* Excerpt Section */}
                    <div style={{ backgroundColor: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333', flexShrink: 0 }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#ccc', fontSize: '1rem', fontWeight: 600 }}>Excerpt</h3>
                        <textarea
                            value={excerpt}
                            onChange={e => setExcerpt(e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px', fontFamily: 'Inter, sans-serif', fontSize: '1rem' }}
                            placeholder="Brief hook for the article..."
                        />
                    </div>

                    {/* Main Content Editor */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#ccc', fontSize: '1rem', fontWeight: 600 }}>Content Markdown</h3>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            style={{
                                flex: 1,
                                minHeight: '500px',
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: '#222',
                                border: '1px solid #444',
                                color: '#e0e0e0',
                                borderRadius: '4px',
                                fontFamily: 'Consolas, Monaco, monospace',
                                fontSize: '0.95rem',
                                lineHeight: '1.6',
                                resize: 'vertical'
                            }}
                            placeholder="# Heading\n\nParagraph text...\n\n![Alt](image-url)"
                        />
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                            Supports Markdown: # H1, ## H2, - List, ![Alt](url), etc. <br />
                            Also supports raw HTML for buttons/images: &lt;div class="movie-cta-container"&gt;...
                        </p>
                    </div>

                </div>

                {/* Preview Column */}
                <div style={{ flex: 1, backgroundColor: '#141414', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <Eye size={16} /> Live Preview
                    </div>

                    {/* Preview Scroll Area - Mimics ArticlePage Structure */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

                        {/* Hero Preview */}
                        {imageUrl && (
                            <div style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', position: 'relative' }}>
                                <img src={imageUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} />
                                <h1 style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', color: 'white', fontSize: '2rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.8)', margin: 0, textAlign: 'center' }}>{title || 'Article Title'}</h1>
                            </div>
                        )}

                        {/* Content Preview Wrapper - Applying Site Styles */}
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                            {/* Excerpt */}
                            {excerpt && (
                                <p style={{
                                    fontSize: '1.25rem', // Matched to refined style
                                    lineHeight: '1.3',
                                    color: '#ffffff',
                                    textAlign: 'left',
                                    marginBottom: '2rem',
                                    fontWeight: 700,
                                    maxWidth: '100%',
                                    // Logic for matching "special article" style
                                    borderLeft: 'none',
                                    paddingLeft: '0'
                                }}>
                                    {excerpt}
                                </p>
                            )}

                            {/* Rich Text Content */}
                            <div className="special-article">
                                <div className="article-content">
                                    <RichTextRenderer content={content} />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* INJECTED STYLES FOR PREVIEW 1:1 MATCH */}
                    <style>{`
                        /* Base container styles matching the site */
                        .special-article .article-content {
                            font-family: 'Inter', sans-serif;
                            color: #d1d1d1; /* Standard article grey */
                            line-height: 1.8; /* Match standard article pacing */
                            font-size: 1.15rem; /* Match standard article size */
                        }
                        .special-article .article-content h1, .article-h1 {
                             font-family: 'Inter', sans-serif; font-size: 2.5rem; font-weight: 800; color: white; margin: 2.5rem 0 1.5rem; letter-spacing: -0.02em;
                        }
                        .special-article .article-content h2, .article-h2 {
                            border-left: 4px solid #e50914;
                            padding-left: 1rem;
                            margin: 3rem 0 1.5rem; /* Standard H2 spacing */
                            color: white; /* Ensure headings stay white */
                            font-family: 'Inter', sans-serif; font-size: 2rem; font-weight: 700;
                        }
                        .special-article .article-content p, .article-p {
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
                        .movie-cta-button .play-icon {
                            font-size: 1.2rem;
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default ArticleEditor;
