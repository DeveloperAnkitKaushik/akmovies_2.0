'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import HeroSlider from '@/components/HeroSlider';
import MovieSection from '@/components/MovieSection';
import { getTrending, getPopularMovies, getPopularTVShows } from '@/utils/tmdb';
import { getTrendingAnime, getPopularAnime, convertAnimeToMovieCard } from '@/utils/anilist';
import { getUserHistory, removeFromHistory, getRecommendations, deleteRecommendation, getUserBookmarks, removeBookmark } from '@/utils/firestore';
import { isUserAdmin } from '@/utils/admin';
import { toast } from 'react-hot-toast';
import styles from './page.module.css';

export default function Home() {
    const [trendingWeek, setTrendingWeek] = useState([]);
    const [trendingDay, setTrendingDay] = useState([]);
    const [popularMovies, setPopularMovies] = useState([]);
    const [popularTVShows, setPopularTVShows] = useState([]);
    const [continueWatching, setContinueWatching] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [trendingAnime, setTrendingAnime] = useState([]);
    const [popularAnime, setPopularAnime] = useState([]);
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

                // Get trending and popular anime
                const [trendingAnimeData, popularAnimeData] = await Promise.all([
                    getTrendingAnime(1, 20),
                    getPopularAnime(1, 20)
                ]);

                // Get admin recommendations
                const recommendationsData = await getRecommendations();

                setTrendingDay(trendingDataDay.slice(0, 10));
                setTrendingWeek(trendingDataWeek.slice(0, 50));
                setPopularMovies(popularMoviesData.results.slice(0, 50));
                setPopularTVShows(popularTVData.results.slice(0, 50));

                // Set anime data
                if (trendingAnimeData?.media) {
                    const convertedTrendingAnime = trendingAnimeData.media.map(anime => convertAnimeToMovieCard(anime));
                    setTrendingAnime(convertedTrendingAnime);
                }
                if (popularAnimeData?.media) {
                    const convertedPopularAnime = popularAnimeData.media.map(anime => convertAnimeToMovieCard(anime));
                    setPopularAnime(convertedPopularAnime);
                }

                setRecommendations(recommendationsData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Function to refresh bookmarks
    const refreshBookmarks = async () => {
        if (isAuthenticated && user?.uid) {
            try {
                const userBookmarks = await getUserBookmarks(user.uid);
                setBookmarks(userBookmarks);
            } catch (error) {
                console.error('Error fetching bookmarks:', error);
            }
        }
    };

    // Fetch continue watching and bookmarks when user is authenticated
    useEffect(() => {
        const fetchUserData = async () => {
            if (isAuthenticated && user?.uid) {
                try {
                    // Fetch continue watching
                    const history = await getUserHistory(user.uid);
                    setContinueWatching(history);

                    // Fetch bookmarks
                    await refreshBookmarks();
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                setContinueWatching([]);
                setBookmarks([]);
            }
        };

        fetchUserData();
    }, [isAuthenticated, user?.uid]);

    // Listen for global bookmark changes
    useEffect(() => {
        const handleBookmarkChange = () => {
            refreshBookmarks();
        };

        window.addEventListener('bookmarkChanged', handleBookmarkChange);

        return () => {
            window.removeEventListener('bookmarkChanged', handleBookmarkChange);
        };
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

    // Handle remove from recommendations
    const handleRemoveFromRecommendations = async (item) => {
        if (!isAuthenticated || !user?.uid) return;

        // Check if user is admin
        if (!isUserAdmin(user)) {
            toast.error('Only admin can remove recommendations');
            return;
        }

        try {
            await deleteRecommendation(item.id, item.mediaType);

            // Update local state
            setRecommendations(prev => prev.filter(rec => rec.id !== item.id));

            toast.success('Removed from recommendations');
        } catch (error) {
            console.error('Error removing from recommendations:', error);
            toast.error('Failed to remove from recommendations');
        }
    };

    // Handle remove from bookmarks
    const handleRemoveFromBookmarks = async (item) => {
        if (!isAuthenticated || !user?.uid) return;

        try {
            await removeBookmark(user.uid, item.id, item.mediaType);

            // Update local state
            setBookmarks(prev => prev.filter(bookmark =>
                !(bookmark.id === item.id && bookmark.mediaType === item.mediaType)
            ));

            toast.success('Removed from bookmarks');
        } catch (error) {
            console.error('Error removing from bookmarks:', error);
            toast.error('Failed to remove from bookmarks');
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
            <HeroSlider movies={trendingDay.slice(0, 8)} onBookmarkChange={refreshBookmarks} />

            {/* Movie Sections */}
            <div className={styles.sectionsContainer}>
                <div className="main-container">
                    <MovieSection title="Trending Now" items={trendingWeek} isLarge={true} />
                    {/* Trending Anime Section */}
                    {trendingAnime.length > 0 && (
                        <MovieSection
                            title="Trending Now Anime"
                            items={trendingAnime}
                            type="anime"
                            isLarge={false}
                        />
                    )}
                    {/* Continue Watching Section - Only show if user is authenticated and has history */}
                    {isAuthenticated && continueWatching.length > 0 && (
                        <MovieSection
                            title="Continue Watching"
                            items={continueWatching}
                            type="continue"
                            onRemove={handleRemoveFromContinueWatching}
                        />
                    )}
                    {/* Admin Recommendations Section */}
                    {recommendations.length > 0 && (
                        <MovieSection
                            title="Admin's Recommendations"
                            items={recommendations}
                            type="recommendations"
                            onRemove={handleRemoveFromRecommendations}
                        />
                    )}
                    {/* Bookmarks Section - Only show if user is authenticated and has bookmarks */}
                    {isAuthenticated && bookmarks.length > 0 && (
                        <MovieSection
                            title="My Bookmarks"
                            items={bookmarks}
                            type="bookmarks"
                            onRemove={handleRemoveFromBookmarks}
                            showAll={true}
                        />
                    )}
                    <MovieSection title="Popular Movies" items={popularMovies} />
                    {/* Popular Anime Section */}
                    {popularAnime.length > 0 && (
                        <MovieSection
                            title="Popular Anime of All Time"
                            items={popularAnime}
                            type="anime"
                            isLarge={false}
                        />
                    )}
                    <MovieSection title="Popular TV Series" items={popularTVShows} />
                </div>
            </div>
        </div>
    );
} 