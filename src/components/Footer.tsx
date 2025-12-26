
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer style={{
            padding: '2rem 0',
            marginTop: 'auto',
            background: 'transparent',
            color: '#666',
            fontSize: '0.9rem',
            textAlign: 'center'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                flexWrap: 'wrap',
                marginBottom: '0.5rem'
            }}>
                <Link
                    to="/about"
                    style={{
                        color: '#444',
                        textDecoration: 'none',
                        padding: '0.5rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#888'}
                    onMouseLeave={e => e.currentTarget.style.color = '#444'}
                >
                    About & Credits
                </Link>

                <Link
                    to="/privacy"
                    style={{
                        color: '#444',
                        textDecoration: 'none',
                        padding: '0.5rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#888'}
                    onMouseLeave={e => e.currentTarget.style.color = '#444'}
                >
                    Privacy Policy
                </Link>

                <Link
                    to="/terms"
                    style={{
                        color: '#444',
                        textDecoration: 'none',
                        padding: '0.5rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#888'}
                    onMouseLeave={e => e.currentTarget.style.color = '#444'}
                >
                    Terms of Service
                </Link>

                <Link
                    to="/contact"
                    style={{
                        color: '#444',
                        textDecoration: 'none',
                        padding: '0.5rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#888'}
                    onMouseLeave={e => e.currentTarget.style.color = '#444'}
                >
                    Contact
                </Link>
            </div>
        </footer>
    );
};

export default Footer;
