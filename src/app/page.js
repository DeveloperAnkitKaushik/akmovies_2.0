'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MovieSection from '@/components/MovieSection';
import HeroSlider from '@/components/HeroSlider';
import { getTrending, getPopularMovies, getPopularTVShows, getTopRatedMovies } from '@/utils/tmdb';
import { getUserHistory, removeFromHistory } from '@/utils/firestore';
import { toast } from 'react-hot-toast';
import styles from './page.module.css';

export default function Home() {
    const [trendingWeek, setTrendingWeek] = useState([]);
    const [trendingDay, setTrendingDay] = useState([]);
    const [popularMovies, setPopularMovies] = useState([]);
    const [popularTVShows, setPopularTVShows] = useState([]);
    const [continueWatching, setContinueWatching] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Get trending for the week (both movies and series)
                const trendingDataDay = await getTrending('all', 'day');

                const trendingDataWeek = await getTrending('all', 'week');

                // Get popular movies of all time (using top rated)
                const popularMoviesData = await getPopularMovies(1);

                // Get popular TV shows
                const popularTVData = await getPopularTVShows(1);

                setTrendingDay(trendingDataDay.slice(0, 30));
                setTrendingWeek(trendingDataWeek.slice(0, 30));
                setPopularMovies(popularMoviesData.results.slice(0, 30));
                setPopularTVShows(popularTVData.results.slice(0, 30));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch continue watching when user is authenticated
    useEffect(() => {
        const fetchContinueWatching = async () => {
            if (isAuthenticated && user?.uid) {
                try {
                    const history = await getUserHistory(user.uid);
                    setContinueWatching(history);
                } catch (error) {
                    console.error('Error fetching continue watching:', error);
                }
            } else {
                setContinueWatching([]);
            }
        };

        fetchContinueWatching();
    }, [isAuthenticated, user?.uid]);

    // Handle remove from continue watching
    const handleRemoveFromContinueWatching = async (item) => {
        if (!isAuthenticated || !user?.uid) return;

        try {
            await removeFromHistory(user.uid, item.id, item.mediaType);

            // Update local state
            setContinueWatching(prev => prev.filter(historyItem =>
                !(historyItem.id === item.id && historyItem.mediaType === item.mediaType)
            ));

            toast.success('Removed from continue watching');
        } catch (error) {
            console.error('Error removing from continue watching:', error);
            toast.error('Failed to remove from continue watching');
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingContent}>
                    <div className={styles.loadingSpinner}></div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Hero Slider */}
            <HeroSlider movies={trendingDay.slice(0, 8)} />

            {/* Movie Sections */}
            <div className={styles.sectionsContainer}>
                <div className="main-container">
                    <MovieSection title="Trending Now" items={trendingWeek} isLarge={true} />
                    {/* Continue Watching Section - Only show if user is authenticated and has history */}
                    {isAuthenticated && continueWatching.length > 0 && (
                        <MovieSection
                            title="Continue Watching"
                            items={continueWatching}
                            type="continue"
                            onRemove={handleRemoveFromContinueWatching}
                        />
                    )}
                    <MovieSection title="Popular Movies" items={popularMovies} />
                    <MovieSection title="Popular TV Series" items={popularTVShows} />
                </div>
            </div>
        </div>
    );
} 