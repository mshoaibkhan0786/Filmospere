
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (key: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_KEY = "LALA HI LALA";
const STORAGE_KEY = "admin_auth_key";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage on mount
        const storedKey = localStorage.getItem(STORAGE_KEY);
        if (storedKey === ADMIN_KEY) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
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
    };

    if (isLoading) {
        return null; // Or a spinner, but null avoids flash
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
