"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import getCroppedImg from '../../utils/cropUtils';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImage: string) => void;
    onCancel: () => void;
    aspectRatio?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel, aspectRatio = 4 / 3 }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const [isSaving, setIsSaving] = useState(false);

    // Use the same proxy URL as cropUtils to ensure dimensions/content match exactly
    // This prevents "crop drift" where the user crops one version but the utility processes another
    const displayImage = React.useMemo(() => {
        if (imageSrc.startsWith('data:')) return imageSrc;
        return `https://wsrv.nl/?url=${encodeURIComponent(imageSrc)}&output=jpg`;
    }, [imageSrc]);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        if (!croppedAreaPixels) {
            console.warn('Crop data not available yet');
            return;
        }

        try {
            setIsSaving(true);
            const croppedImage = await getCroppedImg(
                imageSrc, // Pass original URL, cropUtils will proxy it internally
                croppedAreaPixels,
                rotation
            );
            onCropComplete(croppedImage);
        } catch (e: any) {
            console.error(e);
            alert(`Failed to crop image. ${e.message || 'Possible CORS issue or timeout.'}`);
        } finally {
            setIsSaving(false);
        }
    }, [imageSrc, croppedAreaPixels, rotation, onCropComplete]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                position: 'relative',
                width: '90%',
                height: '70%',
                backgroundColor: '#000',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <Cropper
                    image={displayImage}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspectRatio}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteHandler}
                    onZoomChange={onZoomChange}
                />
            </div>

            <div style={{
                width: '90%',
                marginTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                    <ZoomOut size={20} />
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        style={{ flex: 1 }}
                        disabled={isSaving}
                    />
                    <ZoomIn size={20} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                    <button
                        type="button"
                        onClick={() => setRotation(rotation + 90)}
                        style={{
                            background: '#333',
                            border: 'none',
                            color: 'white',
                            padding: '0.75rem',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            opacity: isSaving ? 0.5 : 1
                        }}
                        title="Rotate"
                        disabled={isSaving}
                    >
                        <RotateCw size={24} />
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            background: '#ef4444',
                            border: 'none',
                            color: 'white',
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 'bold',
                            opacity: isSaving ? 0.5 : 1
                        }}
                        disabled={isSaving}
                    >
                        <X size={20} /> Cancel
                    </button>

                    <button
                        type="button"
                        onClick={showCroppedImage}
                        style={{
                            background: '#22c55e',
                            border: 'none',
                            color: 'white',
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 'bold',
                            opacity: isSaving ? 0.5 : 1
                        }}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={20} /> Save Crop
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
