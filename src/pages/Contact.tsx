import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import emailjs from '@emailjs/browser';

const Contact: React.FC = () => {
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

        try {
            await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                {
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                },
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
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
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', padding: '2rem' }}>
            <Helmet>
                <title>Contact Us - Filmospere</title>
                <meta name="description" content="Get in touch with the Filmospere team. We'd love to hear from you!" />
            </Helmet>

            <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#888', textDecoration: 'none', marginBottom: '2rem' }}>
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>

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
        </div>
    );
};

export default Contact;
