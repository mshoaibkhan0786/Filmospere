"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (key: string) => boolean;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In a real app, this should be an environment variable.
// Keeping parity with the original hardcoded key for now.
const ADMIN_KEY = "LALA HI LALA";
const STORAGE_KEY = "admin_auth_key";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check local storage on mount
        if (typeof window !== 'undefined') {
            const storedKey = localStorage.getItem(STORAGE_KEY);
            if (storedKey === ADMIN_KEY) {
                setIsAuthenticated(true);
            }
            setIsLoading(false);
        }
    }, []);

    const login = (key: string): boolean => {
        if (key === ADMIN_KEY) {
            localStorage.setItem(STORAGE_KEY, key);
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEY);
        setIsAuthenticated(false);
        router.push('/admin/login');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
