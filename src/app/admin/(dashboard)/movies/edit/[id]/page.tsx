import { supabase } from '@/lib/supabase';
import MovieEditor from '@/components/admin/MovieEditor';
import { notFound } from 'next/navigation';

export default async function EditMoviePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: movie } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

    if (!movie) {
        notFound();
    }

    return <MovieEditor initialMovie={{ id: movie.id, ...movie.data }} />;
}
