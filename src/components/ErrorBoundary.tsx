'use client';

import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    backgroundColor: '#141414',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div style={{
                        maxWidth: '500px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '4rem',
                            marginBottom: '1rem'
                        }}>⚠️</div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            marginBottom: '1rem',
                            color: '#e50914'
                        }}>
                            Something Went Wrong
                        </h1>
                        <p style={{
                            fontSize: '1.1rem',
                            color: '#b3b3b3',
                            marginBottom: '2rem',
                            lineHeight: '1.6'
                        }}>
                            We encountered an unexpected error. Please try refreshing the page or return to the homepage.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={{
                                marginBottom: '2rem',
                                padding: '1rem',
                                backgroundColor: '#1f1f1f',
                                borderRadius: '8px',
                                textAlign: 'left',
                                fontSize: '0.9rem',
                                color: '#ff6b6b'
                            }}>
                                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                                    Error Details (Dev Only)
                                </summary>
                                <pre style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontSize: '0.85rem'
                                }}>
                                    {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    backgroundColor: '#e50914',
                                    color: 'white',
                                    padding: '12px 32px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                Reload Page
                            </button>
                            <a
                                href="/"
                                style={{
                                    backgroundColor: '#2a2a2a',
                                    color: 'white',
                                    padding: '12px 32px',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    display: 'inline-block',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                Go to Homepage
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
