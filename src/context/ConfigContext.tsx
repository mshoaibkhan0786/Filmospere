import React, { createContext, useContext, useState, useEffect } from 'react';
import { MAIN_CATEGORIES } from '../constants';

export interface SectionConfig {
    id: string;
    title: string;
    type: 'system' | 'custom';
    query?: string; // For custom sections, this is the tag/category
    visible: boolean;
}

export interface SiteSettings {
    siteName: string;
    footerText: string;
}

interface ConfigContextType {
    sections: SectionConfig[];
    settings: SiteSettings;
    updateSections: (sections: SectionConfig[]) => void;
    updateSettings: (settings: SiteSettings) => void;
    addSection: (title: string, tag: string) => void;
    removeSection: (id: string) => void;
    resetConfig: () => void;
}

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const DEFAULT_SECTIONS: SectionConfig[] = [
    { id: 'latest', title: 'Latest Movies & Series', type: 'system', visible: true },
    { id: 'series', title: 'Web Series', type: 'system', visible: true },
    ...MAIN_CATEGORIES.map(cat => ({
        id: `cat-${cat.toLowerCase()}`,
        title: cat,
        type: 'custom' as const,
        query: cat,
        visible: true
    })),
    { id: 'discover', title: 'Discover', type: 'system', visible: true }
];

const DEFAULT_SETTINGS: SiteSettings = {
    siteName: 'Filmospere',
    footerText: '© 2024 Filmospere. All rights reserved.'
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sections, setSections] = useState<SectionConfig[]>(() => {
        const stored = localStorage.getItem('filmospere_config');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.sections) return parsed.sections;
            } catch (e) {
                console.error('Failed to parse config sections', e);
            }
        }
        return DEFAULT_SECTIONS;
    });

    const [settings, setSettings] = useState<SiteSettings>(() => {
        const stored = localStorage.getItem('filmospere_config');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.settings) return parsed.settings;
            } catch (e) {
                console.error('Failed to parse config settings', e);
            }
        }
        return DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem('filmospere_config', JSON.stringify({ sections, settings }));
    }, [sections, settings]);

    const updateSections = (newSections: SectionConfig[]) => {
        setSections(newSections);
    };

    const updateSettings = (newSettings: SiteSettings) => {
        setSettings(newSettings);
    };

    const addSection = (title: string, tag: string) => {
        const newSection: SectionConfig = {
            id: `custom-${crypto.randomUUID()}`,
            title,
            type: 'custom',
            query: tag,
            visible: true
        };
        // Add before 'Discover' (last item)
        setSections(prev => {
            const last = prev[prev.length - 1];
            const rest = prev.slice(0, -1);
            return [...rest, newSection, last];
        });
    };

    const removeSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
    };

    const resetConfig = () => {
        setSections(DEFAULT_SECTIONS);
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem('filmospere_config');
    };

    return (
        <ConfigContext.Provider value={{
            sections,
            settings,
            updateSections,
            updateSettings,
            addSection,
            removeSection,
            resetConfig
        }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};
