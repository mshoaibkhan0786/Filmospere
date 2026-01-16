"use client";

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: '#1f1f1f',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%',
                border: '1px solid #333',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative'
            }}>
                <button
                    onClick={onCancel}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{
                        backgroundColor: '#ef444420',
                        color: '#ef4444',
                        padding: '1rem',
                        borderRadius: '50%',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AlertTriangle size={32} />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0', color: '#fff' }}>{title}</h2>
                    <p style={{ color: '#aaa', margin: '0 0 2rem 0', lineHeight: 1.5 }}>{message}</p>

                    <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                        <button
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '8px',
                                backgroundColor: '#333',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '8px',
                                backgroundColor: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
