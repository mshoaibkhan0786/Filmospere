import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { ArrowUp, ArrowDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

const SectionsManager: React.FC = () => {
    const { sections, updateSections, addSection, removeSection } = useConfig();
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newSectionTag, setNewSectionTag] = useState('');

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex >= 0 && targetIndex < newSections.length) {
            [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
            updateSections(newSections);
        }
    };

    const toggleVisibility = (index: number) => {
        const newSections = [...sections];
        newSections[index].visible = !newSections[index].visible;
        updateSections(newSections);
    };

    const handleAddSection = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSectionTitle && newSectionTag) {
            addSection(newSectionTitle, newSectionTag);
            setNewSectionTitle('');
            setNewSectionTag('');
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Manage Sections</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Sections List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sections.map((section, index) => (
                        <div
                            key={section.id}
                            style={{
                                backgroundColor: '#2a2a2a',
                                padding: '1rem',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                opacity: section.visible ? 1 : 0.5
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontWeight: 'bold' }}>{section.title}</div>
                                {section.type === 'custom' && (
                                    <span style={{ fontSize: '0.8rem', backgroundColor: '#333', padding: '2px 8px', borderRadius: '4px', color: '#888' }}>
                                        Tag: {section.query}
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => moveSection(index, 'up')}
                                    disabled={index === 0}
                                    title="Move Section Up"
                                    style={{ background: 'none', border: 'none', color: index === 0 ? '#444' : '#fff', cursor: index === 0 ? 'default' : 'pointer' }}
                                >
                                    <ArrowUp size={20} />
                                </button>
                                <button
                                    onClick={() => moveSection(index, 'down')}
                                    disabled={index === sections.length - 1}
                                    title="Move Section Down"
                                    style={{ background: 'none', border: 'none', color: index === sections.length - 1 ? '#444' : '#fff', cursor: index === sections.length - 1 ? 'default' : 'pointer' }}
                                >
                                    <ArrowDown size={20} />
                                </button>
                                <button
                                    onClick={() => toggleVisibility(index)}
                                    title={section.visible ? "Hide Section" : "Show Section"}
                                    style={{ background: 'none', border: 'none', color: section.visible ? '#10b981' : '#666', cursor: 'pointer' }}
                                >
                                    {section.visible ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                                {section.type === 'custom' && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Delete this section?')) {
                                                removeSection(section.id);
                                            }
                                        }}
                                        title="Delete Section"
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '0.5rem' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add New Section */}
                <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px', height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Add Custom Section</h2>
                    <form onSubmit={handleAddSection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Section Title</label>
                            <input
                                type="text"
                                value={newSectionTitle}
                                onChange={(e) => setNewSectionTitle(e.target.value)}
                                placeholder="e.g. Marvel Movies"
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Filter Tag</label>
                            <input
                                type="text"
                                value={newSectionTag}
                                onChange={(e) => setNewSectionTag(e.target.value)}
                                placeholder="e.g. Marvel"
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white' }}
                            />
                        </div>
                        <button
                            type="submit"
                            style={{
                                backgroundColor: '#e50914',
                                color: 'white',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Plus size={20} /> Add Section
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SectionsManager;
