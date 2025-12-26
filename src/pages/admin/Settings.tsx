import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { useMovies } from '../../context/MovieContext';
import { Save, Download, Upload, RotateCcw } from 'lucide-react';

const Settings: React.FC = () => {
    const { settings, updateSettings, resetConfig } = useConfig();
    const { movies } = useMovies(); // We might need a way to bulk import movies
    const [siteName, setSiteName] = useState(settings.siteName);
    const [footerText, setFooterText] = useState(settings.footerText);

    const handleSave = () => {
        updateSettings({ siteName, footerText });
        alert('Settings saved!');
    };

    const handleExport = () => {
        const data = {
            movies,
            config: {
                sections: JSON.parse(localStorage.getItem('filmospere_config') || '{}').sections,
                settings: { siteName, footerText }
            }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `filmospere_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    if (data.movies && Array.isArray(data.movies)) {
                        // This is a bit hacky, ideally we'd have a bulkSetMovies in context
                        // For now we can't easily replace all movies via context without exposing a setter
                        // So we might just warn or rely on the user to know this appends/overwrites?
                        // Actually, let's just update localStorage directly for a full restore and reload
                        if (window.confirm('This will overwrite your current library and settings. Are you sure?')) {
                            localStorage.setItem('filmospere_movies', JSON.stringify(data.movies));
                            if (data.config) {
                                localStorage.setItem('filmospere_config', JSON.stringify(data.config));
                            }
                            window.location.reload();
                        }
                    }
                } catch (error) {
                    alert('Failed to parse backup file.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all settings and sections to default? (Movies will be preserved)')) {
            resetConfig();
            setSiteName('Filmospere');
            setFooterText('© 2024 Filmospere. All rights reserved.');
        }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Settings</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* General Settings */}
                <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>General Settings</h2>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Site Name</label>
                            <input
                                type="text"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white' }}
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            style={{
                                backgroundColor: '#e50914',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: 'fit-content'
                            }}
                        >
                            <Save size={20} /> Save Changes
                        </button>
                    </div>
                </div>

                {/* Data Management */}
                <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Data Management</h2>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleExport}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Download size={20} /> Export Data
                        </button>

                        <label
                            style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 'bold'
                            }}
                        >
                            <Upload size={20} /> Import Data
                            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                        </label>

                        <button
                            onClick={handleReset}
                            style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginLeft: 'auto'
                            }}
                        >
                            <RotateCcw size={20} /> Reset Config
                        </button>




                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
