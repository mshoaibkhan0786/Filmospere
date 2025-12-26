import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Film, Layers, Settings, Home, Users, FileText } from 'lucide-react';

const AdminLayout: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/movies', icon: Film, label: 'Movies' },
        { path: '/admin/cast', icon: Users, label: 'Cast' },
        { path: '/admin/articles', icon: FileText, label: 'Articles' }, // Added Articles
        { path: '/admin/sections', icon: Layers, label: 'Sections' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    const mainRef = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo(0, 0);
        }
    }, [location.pathname]);

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#1a1a1a', color: '#fff' }}>
            {/* Sidebar */}
            <aside style={{ width: '250px', flexShrink: 0, backgroundColor: '#111', borderRight: '1px solid #333', padding: '1.5rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#e50914', whiteSpace: 'nowrap' }}>
                    <Film /> Filmospere Admin
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                color: isActive(item.path) ? '#fff' : '#888',
                                backgroundColor: isActive(item.path) ? '#e50914' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </Link>
                    ))}

                    <div style={{ height: '1px', backgroundColor: '#333', margin: '1rem 0' }} />

                    <Link
                        to="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: '#888',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Home size={20} />
                        Back to Site
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main ref={mainRef} style={{ flex: 1, padding: '2rem', overflowY: 'auto', overflowX: 'hidden' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
