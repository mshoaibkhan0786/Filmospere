"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Movie, StreamingLink } from '../../types';

import EditorBasicInfo from './EditorBasicInfo';
import EditorMedia from './EditorMedia';
import EditorStreaming from './EditorStreaming';
import EditorSeasons from './EditorSeasons';
import EditorCast from './EditorCast';

interface MovieEditorProps {
    initialMovie?: Movie | null;
}

const MovieEditor: React.FC<MovieEditorProps> = ({ initialMovie }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('basic');
    const [isSaving, setIsSaving] = useState(false);

    // Initial Form State
    const [formData, setFormData] = useState<Partial<Movie>>(initialMovie || {
        title: '',
        description: '',
        posterUrl: '',
        contentType: 'movie',
        rating: 0,
        releaseYear: new Date().getFullYear(),
        releaseDate: new Date().toISOString().split('T')[0],
        duration: '',
        language: 'English',
        languages: ['English'],
        tags: [],
        hiddenTags: [],
        cast: [],
        trailerUrl: '',
        budget: '',
        boxOffice: '',
        images: [],
        videos: [],
        streamingLinks: [],
        seasons: []
    });

    const [pendingStreamingLink, setPendingStreamingLink] = useState<StreamingLink>({ platform: '', url: '' });

    // Dummy List of existing actors for search - In a real app this might come from a DB table of actors
    // For now we can keep it empty or populate with some defaults if we had an Actors table
    const existingActors: any[] = [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Validate required fields
            if (!formData.title) throw new Error('Title is required');

            // Prepare payload for "data" column (JSONB)
            const { id, ...movieFields } = formData;

            // Construct the JSON object for the 'data' column
            // We explicitely copy fields to ensure no stray properties, 
            // but spreading movieFields is generally safe if formData is clean.
            // Ensure strict types for arrays to prevent nulls in JSONB
            const movieDataJson = {
                ...movieFields,
                tags: movieFields.tags || [],
                hiddenTags: movieFields.hiddenTags || [],
                languages: movieFields.languages || [],
                cast: movieFields.cast || [],
                images: movieFields.images || [],
                videos: movieFields.videos || [],
                streamingLinks: movieFields.streamingLinks || [],
                seasons: movieFields.seasons || [],
                contentType: movieFields.contentType || 'movie',
            };

            let error;
            if (initialMovie && initialMovie.id) {
                // Update
                const { error: updateError } = await supabase
                    .from('movies')
                    .update({ data: movieDataJson }) // Update ONLY the data column
                    .eq('id', initialMovie.id);
                error = updateError;
            } else {
                // Create
                const { error: insertError } = await supabase
                    .from('movies')
                    .insert([{ data: movieDataJson }]); // Insert into data column
                error = insertError;
            }

            if (error) throw error;

            alert('Movie saved successfully!');
            router.push('/admin/movies');
            router.refresh();

        } catch (err: any) {
            console.error('Error saving movie:', err);
            alert(`Error saving movie: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => router.push('/admin/movies')}
                        style={{
                            background: '#333',
                            border: 'none',
                            color: 'white',
                            padding: '0.75rem',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
                        {initialMovie ? 'Edit Movie' : 'Add New Movie'}
                    </h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    style={{
                        backgroundColor: isSaving ? '#666' : 'var(--primary-color)',
                        color: 'white',
                        padding: '0.75rem 2rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                    }}
                >
                    {isSaving ? 'Saving...' : <><Save size={20} /> Save Movie</>}
                </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'textarea') e.preventDefault(); }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                    {['basic', 'media', 'cast'].map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: activeTab === tab ? 'var(--primary-color)' : '#888',
                                fontSize: '1.1rem',
                                fontWeight: activeTab === tab ? 'bold' : 'normal',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div style={{ display: activeTab === 'basic' ? 'block' : 'none' }}>
                    <EditorBasicInfo formData={formData} setFormData={setFormData} />
                </div>

                <div style={{ display: activeTab === 'media' ? 'block' : 'none' }}>
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        <EditorMedia formData={formData} setFormData={setFormData} />
                        <EditorStreaming
                            formData={formData}
                            setFormData={setFormData}
                            pendingLink={pendingStreamingLink}
                            setPendingLink={setPendingStreamingLink}
                        />
                        {/* Conditionally render Seasons Editor if Content Type is Series */}
                        {(formData as any).contentType === 'series' && (
                            <EditorSeasons formData={formData} setFormData={setFormData} />
                        )}
                    </div>
                </div>

                <div style={{ display: activeTab === 'cast' ? 'block' : 'none' }}>
                    <EditorCast formData={formData} setFormData={setFormData} existingActors={existingActors} />
                </div>
            </form>
        </div>
    );
};

export default MovieEditor;
