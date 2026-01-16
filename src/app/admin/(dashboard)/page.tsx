"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Film, Eye, Star, Calendar, Send } from 'lucide-react';
import type { Movie } from '../../../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ backgroundColor: `${color}20`, padding: '1rem', borderRadius: '12px', color: color }}>
            <Icon size={24} />
        </div>
        <div>
            <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
        </div>
    </div>
);

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalMovies: 0,
        totalViews: 0,
        avgRating: '0.0',
        recentMovies: 0
    });
    const [recentUploads, setRecentUploads] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPinging, setIsPinging] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            const CACHE_KEY = 'admin_dashboard_stats';
            const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

            // 1. Check Cache
            if (typeof window !== 'undefined') {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    try {
                        const { data, timestamp } = JSON.parse(cached);
                        if (Date.now() - timestamp < CACHE_DURATION) {
                            setStats(data.stats);
                            setRecentUploads(data.recent);
                            setIsLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.warn('Invalid cache, refetching...');
                    }
                }
            }

            try {
                // LIGHTWEIGHT FETCH: Select only specific keys from the JSON column
                const { data: statsData, error } = await supabase
                    .from('movies')
                    .select('views:data->views, rating:data->rating, releaseYear:data->releaseYear');

                if (error) throw error;

                let startStats = {
                    totalMovies: 0,
                    totalViews: 0,
                    avgRating: '0.0',
                    recentMovies: 0
                };

                if (statsData) {
                    const total = statsData.length;
                    const views = statsData.reduce((acc, m: any) => acc + (Number(m.views) || 0), 0);
                    const avg = total > 0
                        ? (statsData.reduce((acc, m: any) => acc + (Number(m.rating) || 0), 0) / total).toFixed(1)
                        : '0.0';

                    const currentYear = new Date().getFullYear();
                    const recentCount = statsData.filter((m: any) =>
                        Number(m.releaseYear) === currentYear ||
                        Number(m.releaseYear) === currentYear - 1
                    ).length;

                    startStats = {
                        totalMovies: total,
                        totalViews: views,
                        avgRating: avg,
                        recentMovies: recentCount
                    };
                    setStats(startStats);
                }

                // Fetch recent additions
                const { data: recentData } = await supabase
                    .from('movies')
                    .select('id, data') // Need ID as well
                    .order('updated_at', { ascending: false })
                    .limit(5);

                const recentMoviesList = recentData ? recentData.map(d => ({ ...d.data, id: d.id }) as Movie) : [];
                if (recentData) {
                    setRecentUploads(recentMoviesList);
                }

                // Save to Cache
                if (typeof window !== 'undefined') {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        timestamp: Date.now(),
                        data: {
                            stats: startStats,
                            recent: recentMoviesList
                        }
                    }));
                }

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handlePingIndexNow = async () => {
        setIsPinging(true);
        try {
            // Core URLs to submit
            const urls = [
                'https://filmospere.com/',
                'https://filmospere.com/articles',
                'https://filmospere.com/section/trending',
                'https://filmospere.com/section/web-series',
                'https://filmospere.com/section/latest%20movies%20%26%20series'
            ];

            const res = await fetch('/api/admin/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls })
            });

            if (res.ok) {
                alert('✅ IndexNow Notified! Search engines will visit soon.');
            } else {
                alert('❌ Failed to notify IndexNow. Check console.');
            }
        } catch (e) {
            console.error('Ping failed', e);
            alert('❌ Error contacting server.');
        } finally {
            setIsPinging(false);
        }
    };

    if (isLoading) {
        return <div style={{ padding: '2rem', color: '#888' }}>Loading dashboard statistics...</div>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Dashboard Overview</h1>

                {/* Quick Action Button */}
                <button
                    onClick={handlePingIndexNow}
                    disabled={isPinging}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: isPinging ? '#444' : '#e50914',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: isPinging ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    <Send size={18} />
                    {isPinging ? 'Notifying Bing...' : 'Ping IndexNow'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard title="Total Movies" value={stats.totalMovies} icon={Film} color="#3b82f6" />
                <StatCard title="Total Views" value={stats.totalViews.toLocaleString()} icon={Eye} color="#10b981" />
                <StatCard title="Average Rating" value={stats.avgRating} icon={Star} color="#f59e0b" />
                <StatCard title="New Releases (2024-25)" value={stats.recentMovies} icon={Calendar} color="#8b5cf6" />
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Recent Additions</h2>
            <div style={{ backgroundColor: '#2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                            <th style={{ padding: '1rem' }}>Title</th>
                            <th style={{ padding: '1rem' }}>Year</th>
                            <th style={{ padding: '1rem' }}>Director</th>
                            <th style={{ padding: '1rem' }}>Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentUploads.map(movie => (
                            <tr key={movie.id} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <img src={movie.posterUrl} alt="" style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                    {movie.title}
                                </td>
                                <td style={{ padding: '1rem' }}>{movie.releaseYear}</td>
                                <td style={{ padding: '1rem' }}>{movie.director}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ backgroundColor: '#f59e0b20', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem' }}>
                                        {movie.rating}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
