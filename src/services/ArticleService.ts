
import { supabase } from '../lib/supabase';
import type { Article } from '../types';

export const ArticleService = {
    // Fetch all published articles (for the Hub)
    async getAllArticles(limit = 20): Promise<Article[]> {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching articles:', error);
            return [];
        }
        return data as Article[];
    },

    // Fetch a single article by slug
    async getArticleBySlug(slug: string): Promise<Article | null> {
        const { data: articleData, error } = await supabase
            .from('articles')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .maybeSingle();

        if (error) {
            console.error('Error fetching article:', error);
            return null;
        }

        if (!articleData) return null;

        const article = articleData as Article;

        // Fetch related movie slug manually if joined fetch fails or FK is missing
        if (article.related_movie_id) {
            const { data: movieData } = await supabase
                .from('movies')
                .select('data')
                .eq('id', article.related_movie_id)
                .single();

            if (movieData && movieData.data && movieData.data.slug) {
                article.movie = { slug: movieData.data.slug };
            }
        }

        return article;
    },

    // Fetch related articles for a movie (for Movie Page)
    async getArticlesByMovieId(movieId: string, movieTitle?: string): Promise<Article[]> {
        // Helper to clean title for broader matching
        const getSmartSearchTerm = (title: string) => {
            if (!title) return '';
            let term = title.replace(/^(The|A|An)\s+/i, '');
            term = term.split(/[:\(\)]/)[0];
            return term.trim();
        };

        const searchTerm = movieTitle ? getSmartSearchTerm(movieTitle) : '';

        let query = supabase
            .from('articles')
            .select('*')
            .eq('is_published', true);

        // Valid search term? Search by ID OR Content
        if (searchTerm && searchTerm.length > 2) {
            const orQuery = `related_movie_id.eq.${movieId},content.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`;
            query = query.or(orQuery);
        } else {
            // Fallback: strict ID match only if no good title
            query = query.eq('related_movie_id', movieId);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false }) // Newer first
            .limit(3);

        if (error) {
            console.error('[ArticleService] Error fetching related articles:', error);
            return [];
        }

        return data as Article[];
    },

    // Fetch latest 3 articles (for Home Page "Latest Reads" section if needed)
    async getLatestArticles(): Promise<Article[]> {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) {
            console.error('Error fetching latest articles:', error);
            return [];
        }
        return data as Article[];
    },

    // Create a new article
    async createArticle(article: Partial<Article>): Promise<Article | null> {
        const { data, error } = await supabase
            .from('articles')
            .insert([article])
            .select()
            .single();

        if (error) {
            console.error('[ArticleService] Error creating article:', error);
            return null;
        }
        return data as Article;
    },

    // Update an existing article
    async updateArticle(slug: string, article: Partial<Article>): Promise<Article | null> {
        const { data, error } = await supabase
            .from('articles')
            .update(article)
            .eq('slug', slug)
            .select()
            .single();

        if (error) {
            console.error('[ArticleService] Error updating article:', error);
            return null;
        }
        return data as Article;
    },

    // Delete an article
    async deleteArticle(slug: string): Promise<boolean> {
        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('slug', slug);

        if (error) {
            console.error('[ArticleService] Error deleting article:', error);
            return false;
        }
        return true;
    }
};
