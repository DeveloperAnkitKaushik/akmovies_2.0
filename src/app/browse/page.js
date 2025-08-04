'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Topbar from '@/components/Topbar';
import VerticalResults from '@/components/VerticalResults';
import {
    getPopularMovies,
    getTopRatedMovies,
    getNowPlayingMovies,
    getUpcomingMovies,
    getMovieGenres,
    getMoviesByGenre,
    getPopularTVShows,
    getTopRatedTVShows,
    getOnTheAirTVShows,
    getAiringTodayTVShows,
    getTVGenres,
    getTVShowsByGenre
} from '@/utils/tmdb';
import { FaFilter, FaChevronDown, FaFilm, FaTv } from 'react-icons/fa';
import styles from './page.module.css';

export default function BrowsePage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('popular');
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [mediaType, setMediaType] = useState('movie'); // 'movie' or 'tv'
    const [content, setContent] = useState([]);
    const [movieGenres, setMovieGenres] = useState([]);
    const [tvGenres, setTvGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const movieTabs = [
        { id: 'popular', label: 'Popular', fetch: getPopularMovies },
        { id: 'top_rated', label: 'Top Rated', fetch: getTopRatedMovies },
        { id: 'now_playing', label: 'Now Playing', fetch: getNowPlayingMovies },
        { id: 'upcoming', label: 'Upcoming', fetch: getUpcomingMovies },
    ];

    const tvTabs = [
        { id: 'popular', label: 'Popular', fetch: getPopularTVShows },
        { id: 'top_rated', label: 'Top Rated', fetch: getTopRatedTVShows },
        { id: 'on_the_air', label: 'On The Air', fetch: getOnTheAirTVShows },
        { id: 'airing_today', label: 'Airing Today', fetch: getAiringTodayTVShows },
    ];

    const currentTabs = mediaType === 'movie' ? movieTabs : tvTabs;
    const currentGenres = mediaType === 'movie' ? movieGenres : tvGenres;

    // Handle URL query parameters
    useEffect(() => {
        const urlGenre = searchParams.get('genre');
        const urlType = searchParams.get('type');

        if (urlType && (urlType === 'movie' || urlType === 'tv')) {
            setMediaType(urlType);
        }

        if (urlGenre) {
            const genreId = parseInt(urlGenre);
            setSelectedGenre(genreId);
            setActiveTab(''); // Clear active tab when genre is selected
        }
    }, [searchParams]);

    // Dynamic title based on current filter and content
    useEffect(() => {
        if (loading) {
            document.title = `Loading ${mediaType === 'movie' ? 'Movies' : 'TV Series'} | AKMovies`;
        } else {
            const contentType = mediaType === 'movie' ? 'Movies' : 'TV Series';
            const filterName = selectedGenre ? getActiveGenreName() : getCurrentFilterLabel();
            const contentCount = content.length;

            if (contentCount > 0) {
                document.title = `${filterName} ${contentType} (${contentCount}) | AKMovies`;
            } else {
                document.title = `${filterName} ${contentType} | AKMovies`;
            }
        }
    }, [loading, mediaType, selectedGenre, content.length, activeTab]);

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const [movieGenresData, tvGenresData] = await Promise.all([
                    getMovieGenres(),
                    getTVGenres()
                ]);
                setMovieGenres(movieGenresData);
                setTvGenres(tvGenresData);
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };
        fetchGenres();
    }, []);

    const fetchContent = async (tab, genre = null, page = 1) => {
        try {
            setLoading(true);
            let data;

            if (genre) {
                // If genre is selected, filter by genre (this overrides category)
                if (mediaType === 'movie') {
                    data = await getMoviesByGenre(genre, page);
                } else {
                    data = await getTVShowsByGenre(genre, page);
                }
            } else if (tab) {
                // If no genre but tab is selected, use the category
                const tabData = currentTabs.find(t => t.id === tab);
                if (tabData) {
                    data = await tabData.fetch(page);
                } else {
                    // If the current tab doesn't exist in the new media type, use the first available tab
                    const firstTab = currentTabs[0];
                    if (firstTab) {
                        setActiveTab(firstTab.id);
                        data = await firstTab.fetch(page);
                    } else {
                        throw new Error('No tabs available for this media type');
                    }
                }
            } else {
                // Default to popular if nothing is selected
                const firstTab = currentTabs[0];
                if (firstTab) {
                    setActiveTab(firstTab.id);
                    data = await firstTab.fetch(page);
                } else {
                    throw new Error('No tabs available for this media type');
                }
            }

            if (page === 1) {
                setContent(data.results);
            } else {
                setContent(prev => [...prev, ...data.results]);
            }

            setTotalPages(data.totalPages);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch content if we have a valid tab or genre selected
        if (activeTab || selectedGenre) {
            fetchContent(activeTab, selectedGenre);
        } else {
            // Set default tab if nothing is selected
            setActiveTab('popular');
        }
    }, [activeTab, selectedGenre, mediaType]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        // Don't clear selectedGenre - allow both category and genre to be selected
        setCurrentPage(1);
    };

    const handleGenreChange = (genreId) => {
        setSelectedGenre(genreId);
        // Don't clear activeTab - allow both category and genre to be selected
        setCurrentPage(1);
    };

    const handleMediaTypeChange = (type) => {
        setMediaType(type);
        // Don't reset activeTab and selectedGenre - let the useEffect handle it
        setCurrentPage(1);
    };

    const loadMore = () => {
        if (currentPage < totalPages && !loading) {
            fetchContent(activeTab, selectedGenre, currentPage + 1);
        }
    };

    const getActiveGenreName = () => {
        if (!selectedGenre) return '';
        const genre = currentGenres.find(g => g.id === selectedGenre);
        return genre ? genre.name : '';
    };

    const getCurrentFilterLabel = () => {
        const categoryLabel = currentTabs.find(t => t.id === activeTab)?.label || 'Popular';
        const genreLabel = selectedGenre ? getActiveGenreName() : '';

        if (selectedGenre && activeTab) {
            // Both category and genre are selected
            return `${categoryLabel} ${genreLabel}`;
        } else if (selectedGenre) {
            // Only genre is selected
            return genreLabel;
        } else {
            // Only category is selected
            return categoryLabel;
        }
    };

    const getContentTypeLabel = () => {
        return mediaType === 'movie' ? 'Movies' : 'TV Series';
    };

    const getSectionTitle = () => {
        const categoryLabel = currentTabs.find(t => t.id === activeTab)?.label || 'Popular';
        const genreLabel = selectedGenre ? getActiveGenreName() : '';
        const contentTypeLabel = getContentTypeLabel();

        if (selectedGenre && activeTab) {
            // Both category and genre are selected
            return `${categoryLabel} ${genreLabel} ${contentTypeLabel}`;
        } else if (selectedGenre) {
            // Only genre is selected
            return `${genreLabel} ${contentTypeLabel}`;
        } else {
            // Only category is selected
            return `${categoryLabel} ${contentTypeLabel}`;
        }
    };

    return (
        <div className={styles.container}>
            <Topbar name="Browse" />
            <div className="main-container">
                <div className={styles.content}>
                    <div className={styles.filterButtonContainer}>
                        <button
                            className={styles.filterButton}
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        >
                            <FaFilter className={styles.filterIcon} />
                            <span>{getCurrentFilterLabel()}</span>
                            <FaChevronDown className={`${styles.dropdownIcon} ${showFilterDropdown ? styles.rotated : ''}`} />
                        </button>
                    </div>

                    {showFilterDropdown && (
                        <div className={styles.filterOverlay}>
                            <div className={styles.filterExpanded}>
                                <div className={styles.filterContent}>
                                    {/* Media Type Selection */}
                                    <div className={styles.filterSection}>
                                        <h3 className={styles.filterSectionTitle}>Content Type</h3>
                                        <div className={styles.filterOptions}>
                                            <button
                                                onClick={() => handleMediaTypeChange('movie')}
                                                className={`${styles.filterOption} ${mediaType === 'movie' ? styles.active : ''}`}
                                            >
                                                <FaFilm />
                                                Movies
                                            </button>
                                            <button
                                                onClick={() => handleMediaTypeChange('tv')}
                                                className={`${styles.filterOption} ${mediaType === 'tv' ? styles.active : ''}`}
                                            >
                                                <FaTv />
                                                TV Series
                                            </button>
                                        </div>
                                    </div>

                                    {/* Category Tabs */}
                                    <div className={styles.filterSection}>
                                        <h3 className={styles.filterSectionTitle}>Categories</h3>
                                        <div className={styles.filterOptions}>
                                            {currentTabs.map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => handleTabChange(tab.id)}
                                                    className={`${styles.filterOption} ${activeTab === tab.id ? styles.active : ''}`}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Genre Filter */}
                                    <div className={styles.filterSection}>
                                        <h3 className={styles.filterSectionTitle}>Genres</h3>
                                        <div className={styles.filterOptions}>
                                            <button
                                                onClick={() => handleGenreChange(null)}
                                                className={`${styles.filterOption} ${!selectedGenre ? styles.active : ''}`}
                                            >
                                                All Genres
                                            </button>
                                            {currentGenres.map((genre) => (
                                                <button
                                                    key={genre.id}
                                                    onClick={() => handleGenreChange(genre.id)}
                                                    className={`${styles.filterOption} ${selectedGenre === genre.id ? styles.active : ''}`}
                                                >
                                                    {genre.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Section */}
                    {loading && content.length === 0 ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.loadingContent}>
                                <div className={styles.spinner}></div>
                                <p className={styles.loadingText}>Loading {mediaType === 'movie' ? 'movies' : 'series'}...</p>
                            </div>
                        </div>
                    ) : content.length > 0 ? (
                        <div className={styles.contentSection}>
                            <VerticalResults
                                items={content.map(item => ({ ...item, media_type: mediaType }))}
                                loading={loading && content.length > 0}
                                hasMore={currentPage < totalPages}
                                onLoadMore={loadMore}
                                emptyMessage={`No ${mediaType === 'movie' ? 'movies' : 'series'} found. Try selecting a different category or genre.`}
                                gridCols={6}
                                showLoadMore={true}
                            />
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V2a1 1 0 011-1h2a1 1 0 011 1v2m0 0v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v14z" />
                                </svg>
                            </div>
                            <h3 className={styles.emptyTitle}>No {mediaType === 'movie' ? 'movies' : 'series'} found</h3>
                            <p className={styles.emptyText}>
                                Try selecting a different category or genre
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 