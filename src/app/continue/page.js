'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserHistory, removeFromHistory, clearHistory } from '@/utils/firestore';
import MovieCard from '@/components/MovieCard';
import MovieSection from '@/components/MovieSection';
import Topbar from '@/components/Topbar';
import { FaTrash, FaHistory } from 'react-icons/fa';
import styles from './page.module.css';

export default function ContinuePage() {
    const { user, isAuthenticated } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);

    // Dynamic title based on history count
    useEffect(() => {
        if (!isAuthenticated) {
            document.title = 'Continue Watching | AKMovies';
        } else if (loading) {
            document.title = 'Loading Continue Watching | AKMovies';
        } else if (history.length === 0) {
            document.title = 'Continue Watching | AKMovies';
        } else {
            document.title = `Continue Watching (${history.length} items) | AKMovies`;
        }
    }, [isAuthenticated, loading, history.length]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!isAuthenticated || !user?.uid) {
                setHistory([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const userHistory = await getUserHistory(user.uid);
                setHistory(userHistory);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [isAuthenticated, user?.uid]);

    const handleRemoveItem = async (item) => {
        if (!isAuthenticated || !user?.uid) return;

        try {
            await removeFromHistory(user.uid, item.id, item.mediaType);
            setHistory(prev => prev.filter(historyItem =>
                !(historyItem.id === item.id && historyItem.mediaType === item.mediaType)
            ));
        } catch (error) {
            console.error('Error removing item:', error);
        }
    };

    const handleClearHistory = async () => {
        if (!isAuthenticated || !user?.uid) return;

        try {
            setClearing(true);
            const success = await clearHistory(user.uid);
            if (success) {
                setHistory([]);
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        } finally {
            setClearing(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className={styles.container}>
                <div className={styles.authPrompt}>
                    <FaHistory className={styles.authIcon} />
                    <h2>Sign in to Continue Watching</h2>
                    <p>Please sign in to view your continue watching history and track your progress.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading your continue watching history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Topbar name="Continue Watching" />
            <div className="main-container">
                {/* Content */}
                {history.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaHistory className={styles.emptyIcon} />
                        <h2>No Continue Watching Items</h2>
                        <p>Start watching movies and TV shows to see them here.</p>
                    </div>
                ) : (
                    <div className={styles.content}>
                        <MovieSection
                            title=""
                            items={history}
                            isLarge={true}
                            type="continue"
                            onRemove={handleRemoveItem}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}