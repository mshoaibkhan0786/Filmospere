"use client";

import React, { useState, Suspense } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';

const LoginFormContent: React.FC = () => {
    const [key, setKey] = useState('');
    const [error, setError] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get the page the user was trying to access, or default to /admin
    // Note: Next.js middleware usually handles 'from', but we'll stick to simple redirect for now
    const from = '/admin';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(key)) {
            router.replace(from);
        } else {
            setError(true);
            setKey('');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                backgroundColor: '#141414',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                border: '1px solid #333'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: error ? 'rgba(229, 9, 20, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        border: error ? '1px solid #e50914' : '1px solid #333'
                    }}>
                        <Lock size={32} color={error ? '#e50914' : 'white'} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Admin Access</h1>
                    <p style={{ color: '#888' }}>Enter your security key to continue</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => {
                                setKey(e.target.value);
                                setError(false);
                            }}
                            name="security-key"
                            id="admin-key"
                            placeholder="Enter Security Key"
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: '#0a0a0a',
                                border: error ? '1px solid #e50914' : '1px solid #333',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = error ? '#e50914' : '#666'}
                            onBlur={(e) => e.target.style.borderColor = error ? '#e50914' : '#333'}
                        />
                        {error && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#e50914',
                                fontSize: '0.875rem',
                                marginTop: '0.75rem'
                            }}>
                                <AlertCircle size={16} />
                                <span>Invalid security key</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: '#e50914',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f61c2d'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e50914'}
                    >
                        Unlock Dashboard <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}></div>}>
            <LoginFormContent />
        </Suspense>
    );
}
