'use client';

import React, { useState } from 'react';
import { Mail, Send, Instagram } from 'lucide-react';
import emailjs from '@emailjs/browser';
import PageBackButton from '@/components/PageBackButton';

// We'll manage meta separately or in a layout, but for now client component pages don't export metadata effectively in same file
// unless we make a wrapper. But standard way for interactive page is 'use client'.
// So we can accept default metadata from layout or adding a separate head if really needed.
// For now, let's just stick to 'use client' logic.

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

        if (!serviceId || !templateId || !publicKey) {
            setError('Email service is not configured correctly.');
            setLoading(false);
            return;
        }

        try {
            await emailjs.send(
                serviceId,
                templateId,
                {
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                },
                publicKey
            );
            setSubmitted(true);
        } catch (err) {
            console.error('EmailJS Error:', err);
            setError('Failed to send message. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', padding: '100px 2rem 2rem' }}>
            <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <PageBackButton />
                </div>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', borderBottom: '3px solid #e50914', paddingBottom: '0.5rem' }}>Contact Us</h1>
                <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Have questions, suggestions, or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
                </p>

                {!submitted ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {error && (
                            <div className="fade-in-up" style={{ padding: '1rem', backgroundColor: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', borderRadius: '8px', color: '#ff4d4d' }}>
                                {error}
                            </div>
                        )}
                        <div>
                            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontWeight: '500' }}>
                                Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                required
                                disabled={loading}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    backgroundColor: '#1a1a1a',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    opacity: loading ? 0.7 : 1
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontWeight: '500' }}>
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                required
                                disabled={loading}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    backgroundColor: '#1a1a1a',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    opacity: loading ? 0.7 : 1
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontWeight: '500' }}>
                                Message *
                            </label>
                            <textarea
                                id="message"
                                required
                                rows={6}
                                disabled={loading}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    backgroundColor: '#1a1a1a',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    opacity: loading ? 0.7 : 1
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.875rem 2rem',
                                backgroundColor: loading ? '#333' : '#e50914',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                alignSelf: 'flex-start',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            {loading ? (
                                <>Sending...</>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Send Message
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="fade-in-up" style={{
                        padding: '2rem',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '12px',
                        border: '2px solid #22c55e',
                        textAlign: 'center'
                    }}>
                        <Mail size={48} style={{ color: '#22c55e', marginBottom: '1rem' }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#22c55e' }}>Message Sent!</h2>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                            Thank you for contacting us. We'll get back to you shortly at {formData.email}.
                        </p>
                        <button
                            onClick={() => {
                                setSubmitted(false);
                                setFormData({ name: '', email: '', message: '' });
                            }}
                            style={{
                                marginTop: '1.5rem',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'transparent',
                                color: '#22c55e',
                                border: '1px solid #22c55e',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Send Another Message
                        </button>
                    </div>
                )}
            </div>

            <div style={{
                marginTop: '4rem',
                paddingTop: '2rem',
                borderTop: '1px solid #222',
                textAlign: 'center'
            }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#888' }}>Connect with us on Social Media</h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                    <a
                        href="https://instagram.com/filmospere"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: '#ccc',
                            transition: 'color 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            textDecoration: 'none'
                        }}
                    >
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            backgroundColor: '#222',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #333'
                        }}>
                            <Instagram size={24} color="#E4405F" />
                        </div>
                        <span style={{ fontSize: '0.9rem' }}>Instagram</span>
                    </a>

                    <a
                        href="https://pin.it/13ceGnoCW"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: '#ccc',
                            transition: 'color 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            textDecoration: 'none'
                        }}
                    >
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            backgroundColor: '#222',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #333'
                        }}>
                            {/* Using a custom SVG for Pinterest since Lucide might not have the brand icon yet, or using closest metaphor */}
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="#BD081C"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.399.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.173 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.62 0 12.017 0z" />
                            </svg>
                        </div>
                        <span style={{ fontSize: '0.9rem' }}>Pinterest</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
