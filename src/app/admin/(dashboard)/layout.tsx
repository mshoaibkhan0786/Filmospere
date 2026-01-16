"use client";

import React, { useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, usePathname, redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Film, Layers, Settings, Home, Users, FileText } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Protection Logic
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    // Navigation Items
    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/movies', icon: Film, label: 'Movies' },
        { path: '/admin/cast', icon: Users, label: 'Cast' },
        { path: '/admin/articles', icon: FileText, label: 'Articles' },
        { path: '/admin/sections', icon: Layers, label: 'Sections' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    const isActive = (path: string) => {
        // Exact match for admin root, startsWith for others
        if (path === '/admin') return pathname === '/admin';
        return pathname.startsWith(path);
    };

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
                            href={item.path}
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
                        href="/"
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
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', overflowX: 'hidden' }}>
                {children}
            </main>
        </div>
    );
}
