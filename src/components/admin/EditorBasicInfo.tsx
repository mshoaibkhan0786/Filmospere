"use client";

import React, { useState, useEffect } from 'react';
import { Crop } from 'lucide-react';
import ImageCropper from './ImageCropper';
import type { Movie } from '../../types';
import { formatDateForInput } from '../../utils/formatUtils';

interface EditorBasicInfoProps {
    formData: Partial<Movie>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Movie>>>;
}

const EditorBasicInfo: React.FC<EditorBasicInfoProps> = ({ formData, setFormData }) => {
    const [tagsInput, setTagsInput] = useState('');
    const [hiddenTagsInput, setHiddenTagsInput] = useState('');
    const [languagesInput, setLanguagesInput] = useState('');
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        setTagsInput(formData.tags ? formData.tags.join(', ') : '');
        setHiddenTagsInput(formData.hiddenTags ? formData.hiddenTags.join(', ') : '');
        setLanguagesInput(formData.languages ? formData.languages.join(', ') : '');
    }, [formData.tags, formData.hiddenTags, formData.languages]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-update release year when release date changes
            if (name === 'releaseDate' && value) {
                // value is YYYY-MM-DD from date input
                const year = parseInt(value.split('-')[0]);
                if (!isNaN(year)) {
                    newData.releaseYear = year;
                }
            }

            return newData;
        });
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagsInput(e.target.value);
    };

    const handleTagsBlur = () => {
        const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t);
        setFormData(prev => ({ ...prev, tags: tagsArray }));
        // Optional: formatting the input back to clean comma-separated
        setTagsInput(tagsArray.join(', '));
    };

    const handleHiddenTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHiddenTagsInput(e.target.value);
    };

    const handleHiddenTagsBlur = () => {
        const tagsArray = hiddenTagsInput.split(',').map(t => t.trim()).filter(t => t);
        setFormData(prev => ({ ...prev, hiddenTags: tagsArray }));
        setHiddenTagsInput(tagsArray.join(', '));
    };

    const handleLanguagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLanguagesInput(e.target.value);
    };

    const handleLanguagesBlur = () => {
        const langsArray = languagesInput.split(',').map(t => t.trim()).filter(t => t);
        setFormData(prev => ({ ...prev, languages: langsArray }));
        setLanguagesInput(langsArray.join(', '));

        // If primary language is not in the new list, default to the first one
        if (langsArray.length > 0 && (!formData.language || !langsArray.includes(formData.language))) {
            setFormData(prev => ({ ...prev, language: langsArray[0] }));
        }
    };



    return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Basic Information</h3>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ marginLeft: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Content Type</label>
                            <select
                                name="contentType"
                                value={formData.contentType || 'movie'}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            >
                                <option value="movie">Movie</option>
                                <option value="series">Web Series</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Director</label>
                        <input
                            type="text"
                            name="director"
                            value={formData.director}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Categorization</h3>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Tags (comma separated)</label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={handleTagsChange}
                            onBlur={handleTagsBlur}
                            placeholder="Action, Adventure, Sci-Fi"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Hidden Tags (for search only)</label>
                        <input
                            type="text"
                            value={hiddenTagsInput}
                            onChange={handleHiddenTagsChange}
                            onBlur={handleHiddenTagsBlur}
                            placeholder="keywords, alternate titles, misspellings"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Languages (comma separated)</label>
                            <input
                                type="text"
                                value={languagesInput}
                                onChange={handleLanguagesChange}
                                onBlur={handleLanguagesBlur}
                                placeholder="English, Hindi, Spanish"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Primary Language</label>
                            <select
                                name="language"
                                value={formData.language}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            >
                                {formData.languages?.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Details</h3>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Poster URL - Separate Row */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Poster URL (Thumbnail)</label>
                        <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="url"
                                name="posterUrl"
                                value={formData.posterUrl}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (formData.posterUrl) setIsCropping(true);
                                    else alert('Please enter a URL first');
                                }}
                                style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#333',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                                title="Crop Poster"
                            >
                                <Crop size={20} />
                            </button>
                        </div>
                        {isCropping && formData.posterUrl && (
                            <ImageCropper
                                imageSrc={formData.posterUrl}
                                aspectRatio={2 / 3}
                                onCancel={() => setIsCropping(false)}
                                onCropComplete={(croppedImage) => {
                                    setFormData(prev => ({ ...prev, posterUrl: croppedImage }));
                                    setIsCropping(false);
                                }}
                            />
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3rem', rowGap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Budget</label>
                            <input
                                type="text"
                                name="budget"
                                value={formData.budget}
                                onChange={handleChange}
                                placeholder="$160.0M"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Box Office</label>
                            <input
                                type="text"
                                name="boxOffice"
                                value={formData.boxOffice}
                                onChange={handleChange}
                                placeholder="$1.2B"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>
                                {formData.contentType === 'series' ? 'Total Seasons' : 'Duration'}
                            </label>
                            {formData.contentType === 'series' ? (
                                <input
                                    type="text"
                                    name="totalSeasons"
                                    value={formData.totalSeasons || ''}
                                    onChange={handleChange}
                                    placeholder="e.g. 5 Seasons"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                                />
                            ) : (
                                <input
                                    type="text"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    placeholder="2h 30m"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                                />
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Release Year</label>
                            <input
                                type="number"
                                name="releaseYear"
                                value={formData.releaseYear}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Release Date</label>
                            <input
                                type="date"
                                name="releaseDate"
                                value={formatDateForInput(formData.releaseDate)}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Rating (0-10)</label>
                            <input
                                type="number"
                                name="rating"
                                value={formData.rating}
                                onChange={handleChange}
                                step="any"
                                min="0"
                                max="10"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorBasicInfo;
