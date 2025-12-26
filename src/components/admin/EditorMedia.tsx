import React from 'react';
import { Trash2, Crop } from 'lucide-react';
import type { Movie } from '../../types';
import { isValidUrl } from '../../utils/videoUtils';
import ImageCropper from './ImageCropper';

interface EditorMediaProps {
    formData: Partial<Movie>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Movie>>>;
}

const EditorMedia: React.FC<EditorMediaProps> = ({ formData, setFormData }) => {
    const [croppingIndex, setCroppingIndex] = React.useState<number | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ... existing Add button logic ...

    // Logic helper for adding images
    const handleAddImage = () => {
        const input = document.getElementById('newHeroImage') as HTMLInputElement;
        let url = input.value.trim();
        if (url) {
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            if (isValidUrl(url)) {
                setFormData(prev => {
                    const currentImages = prev.images || [];
                    if (currentImages.includes(url)) {
                        alert('This image has already been added.');
                        return prev;
                    }
                    return { ...prev, images: [...currentImages, url] };
                });
                input.value = '';
            } else {
                alert('Please enter a valid image URL.');
            }
        }
    };

    return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Media Management: Banners */}
            <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Hero Section</h3>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Hero Images (Big Posters)</label>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Add direct image links (ending in .jpg, .png, etc.) for high-quality hero backgrounds.</p>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <input
                            type="url"
                            id="newHeroImage"
                            placeholder="Image URL"
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white' }}
                        />
                        <button
                            type="button"
                            onClick={handleAddImage}
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', backgroundColor: '#333', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Add
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {formData.images?.map((url, index) => (
                            <div key={index} style={{ position: 'relative', aspectRatio: '21/9', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                                <img src={url} alt={`Hero ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{
                                    position: 'absolute',
                                    top: '0.5rem',
                                    right: '0.5rem',
                                    display: 'flex',
                                    gap: '0.5rem'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setCroppingIndex(index)}
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            padding: '0.4rem',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Crop Image"
                                    >
                                        <Crop size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) }))}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.8)',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            padding: '0.4rem',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Remove Image"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {croppingIndex !== null && formData.images && formData.images[croppingIndex] && (
                <ImageCropper
                    imageSrc={formData.images[croppingIndex]}
                    aspectRatio={21 / 9}
                    onCancel={() => setCroppingIndex(null)}
                    onCropComplete={(croppedImage) => {
                        setFormData(prev => {
                            const newImages = [...(prev.images || [])];
                            newImages[croppingIndex] = croppedImage;
                            return { ...prev, images: newImages };
                        });
                        setCroppingIndex(null);
                    }}
                />
            )}
            {/* Media Management: Trailer */}
            <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Trailer</h3>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Trailer URL (YouTube)</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="url"
                            name="trailerUrl"
                            value={formData.trailerUrl || ''}
                            onChange={handleChange}
                            placeholder="https://www.youtube.com/watch?v=..."
                            style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>
            </div >

            {/* Media Management: Videos */}
            < div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Videos (Trailers, Clips)</h3>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Title</label>
                            <input
                                type="text"
                                id="newVideoTitle"
                                placeholder="e.g. Official Trailer"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Video URL</label>
                            <input
                                type="url"
                                id="newVideoUrl"
                                placeholder="YouTube URL"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const titleInput = document.getElementById('newVideoTitle') as HTMLInputElement;
                            const urlInput = document.getElementById('newVideoUrl') as HTMLInputElement;
                            if (titleInput.value && urlInput.value) {
                                // Extract YouTube ID for thumbnail
                                let thumb = '';
                                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                const match = urlInput.value.match(regExp);
                                if (match && match[2].length === 11) {
                                    thumb = `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
                                }

                                const newVideo = {
                                    id: crypto.randomUUID(),
                                    title: titleInput.value,
                                    videoUrl: urlInput.value,
                                    thumbnailUrl: thumb,
                                    duration: ''
                                };
                                setFormData(prev => ({ ...prev, videos: [...(prev.videos || []), newVideo] }));
                                titleInput.value = '';
                                urlInput.value = '';
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        Add Video
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {formData.videos?.length === 0 && (
                        <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No videos added yet.</div>
                    )}
                    {formData.videos?.map((video, idx) => {
                        return (
                            <div key={video.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
                                <div style={{ overflow: 'hidden', flex: 1, marginRight: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>{video.title}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.videoUrl}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newVideos = [...(formData.videos || [])];
                                            newVideos.splice(idx, 1);
                                            setFormData(prev => ({ ...prev, videos: newVideos }));
                                        }}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                        title="Remove Video"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div >
        </div >
    );
};

export default EditorMedia;
