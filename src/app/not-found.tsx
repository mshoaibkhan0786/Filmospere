import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0a0a0a',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            textAlign: 'center'
        }}>
            <h1 style={{ fontSize: '6rem', fontWeight: 'bold', color: '#e50914', marginBottom: '1rem' }}>404</h1>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page Not Found</h2>
            <p style={{ color: '#888', marginBottom: '2rem', maxWidth: '400px' }}>
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                href="/"
                style={{
                    padding: '1rem 2rem',
                    backgroundColor: '#e50914',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s',
                }}
            >
                Go Home
            </Link>
        </div>
    );
}
