import { supabase } from '@/lib/supabase';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { notFound } from 'next/navigation';
import type { Article } from '@/types';

export default async function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch article by slug
    const { data: article } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!article) {
        notFound();
    }

    return <ArticleEditor initialArticle={article as Article} />;
}
