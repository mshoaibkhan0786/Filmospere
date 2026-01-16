import React from 'react';
import { Metadata } from 'next';
import { AuthProvider } from '../../context/AuthContext';

export const metadata: Metadata = {
    title: 'Filmosphere Admin',
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false
        }
    }
};

export default function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}
