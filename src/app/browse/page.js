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
    getTVShowsByGenre,
    discoverContent
} from '@/utils/tmdb';
import { getTrendingAnime, getPopularAnime, getAnimeGenres, getAnimeStudios, convertAnimeToMovieCard } from '@/utils/anilist';
import { FaFilter, FaChevronDown, FaFilm, FaTv, FaPlay } from 'react-icons/fa';
import styles from './page.module.css';

export default function BrowsePage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('popular');
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [mediaType, setMediaType] = useState('movie'); // 'movie', 'tv', or 'anime'
    const [content, setContent] = useState([]);
    const [movieGenres, setMovieGenres] = useState([]);
    const [tvGenres, setTvGenres] = useState([]);
    const [animeGenres, setAnimeGenres] = useState([]);
    const [animeStudios, setAnimeStudios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedStudio, setSelectedStudio] = useState(null);

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

    const animeTabs = [
        { id: 'trending', label: 'Trending', fetch: getTrendingAnime },
        { id: 'popular', label: 'Popular', fetch: getPopularAnime },
    ];

    const countryOptions = [
        { code: 'AU', name: 'Australia' },
        { code: 'BR', name: 'Brazil' },
        { code: 'CA', name: 'Canada' },
        { code: 'CN', name: 'China' },
        { code: 'FR', name: 'France' },
        { code: 'DE', name: 'Germany' },
        { code: 'HK', name: 'Hong Kong' },
        { code: 'IN', name: 'India' },
        { code: 'IT', name: 'Italy' },
        { code: 'JP', name: 'Japan' },
        { code: 'MX', name: 'Mexico' },
        { code: 'KR', name: 'South Korea' },
        { code: 'ES', name: 'Spain' },
        { code: 'TR', name: 'Turkey' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'US', name: 'United States' },
    ];

    const currentTabs = mediaType === 'movie' ? movieTabs : mediaType === 'tv' ? tvTabs : animeTabs;
    const currentGenres = mediaType === 'movie' ? movieGenres : mediaType === 'tv' ? tvGenres : animeGenres;

    // Handle URL query parameters
    useEffect(() => {
        const urlGenre = searchParams.get('genre');
        const urlType = searchParams.get('type');
        const urlCountry = searchParams.get('country');
        const urlStudio = searchParams.get('studio');
        const urlId = searchParams.get('id');

        if (urlType && (urlType === 'movie' || urlType === 'tv' || urlType === 'anime')) {
            setMediaType(urlType);
        }

        // Handle country from URL
        if (urlCountry) {
            setSelectedCountry(urlCountry);
            setActiveTab('');
        }

        // Handle studio from URL (for anime)
        if (urlStudio) {
            setSelectedStudio(urlStudio);
            setActiveTab('');
        }

        // Handle genre from URL
        if (urlGenre) {
            if (urlType === 'anime') {
                // For anime, genre is a string name, not an ID
                setSelectedGenre(urlGenre);
            } else {
                const genreId = parseInt(urlGenre);
                setSelectedGenre(genreId);
            }
            setActiveTab('');
        }

        // Handle ID from URL (for anime)
        if (urlId && urlType === 'anime') {
            // This could be used to show specific anime or related content
            setActiveTab('');
        }
    }, [searchParams]);

    const getActiveGenreName = () => {
        if (!selectedGenre) return '';
        if (mediaType === 'anime') {
            return selectedGenre; // For anime, genre is already a string
        }
        const genre = currentGenres.find(g => g.id === selectedGenre);
        return genre ? genre.name : '';
    };

    const getCurrentFilterLabel = () => {
        const categoryLabel = currentTabs.find(t => t.id === activeTab)?.label || 'Popular';
        const genreLabel = selectedGenre ? getActiveGenreName() : '';
        const studioLabel = selectedStudio ? `Studio: ${selectedStudio}` : '';

        if (selectedGenre && activeTab) {
            return `${categoryLabel} ${genreLabel}`;
        } else if (selectedGenre) {
            return genreLabel;
        } else if (selectedStudio) {
            return studioLabel;
        } else {
            return categoryLabel;
        }
    };

    // Dynamic title based on current filter and content
    useEffect(() => {
        if (loading) {
            const contentType = mediaType === 'movie' ? 'Movies' : mediaType === 'tv' ? 'TV Series' : 'Anime';
            document.title = `Loading ${contentType} | AKMovies`;
        } else {
            const contentType = mediaType === 'movie' ? 'Movies' : mediaType === 'tv' ? 'TV Series' : 'Anime';
            const filterName = selectedGenre ? getActiveGenreName() : getCurrentFilterLabel();
            const contentCount = content?.length || 0;

            if (contentCount > 0) {
                document.title = `${filterName} ${contentType} (${contentCount}) | AKMovies`;
            } else {
                document.title = `${filterName} ${contentType} | AKMovies`;
            }
        }
    }, [loading, mediaType, selectedGenre, content, activeTab, currentGenres, currentTabs, selectedStudio]);

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                if (mediaType === 'anime') {
                    const [animeGenresData, animeStudiosData] = await Promise.all([
                        getAnimeGenres(),
                        getAnimeStudios()
                    ]);
                    setAnimeGenres(animeGenresData);
                    setAnimeStudios(animeStudiosData);
                } else {
                    const [movieGenresData, tvGenresData] = await Promise.all([
                        getMovieGenres(),
                        getTVGenres()
                    ]);
                    setMovieGenres(movieGenresData);
                    setTvGenres(tvGenresData);
                }
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };
        fetchGenres();
    }, [mediaType]);

    const fetchContent = async (tab, genre = null, country = null, studio = null, page = 1) => {
        try {
            setLoading(true);
            let data;

            if (mediaType === 'anime') {
                // Handle anime content fetching
                if (tab === 'trending') {
                    data = await getTrendingAnime(page, 20);
                } else if (tab === 'popular') {
                    data = await getPopularAnime(page, 20);
                } else {
                    // Default to popular if no tab specified
                    data = await getPopularAnime(page, 20);
                }

                console.log('Raw anime data:', data); // Debug log

                // For anime, we need to filter by genre and studio if specified
                if (data && data.media) {
                    let filteredResults = data.media;

                    console.log('Before filtering:', filteredResults.length, 'anime'); // Debug log

                    if (genre) {
                        filteredResults = filteredResults.filter(anime =>
                            anime.genres && anime.genres.includes(genre)
                        );
                        console.log('After genre filtering:', filteredResults.length, 'anime'); // Debug log
                    }

                    if (studio) {
                        filteredResults = filteredResults.filter(anime =>
                            anime.studios && anime.studios.nodes &&
                            anime.studios.nodes.some(s => s.name === studio)
                        );
                        console.log('After studio filtering:', filteredResults.length, 'anime'); // Debug log
                    }

                    // Convert anime data to MovieCard format and match expected structure
                    data = {
                        results: filteredResults.map(anime => convertAnimeToMovieCard(anime)),
                        totalPages: data.pageInfo ? data.pageInfo.lastPage : Math.ceil(filteredResults.length / 20),
                        currentPage: data.pageInfo ? data.pageInfo.currentPage : page
                    };
                }
            } else {
                // Handle movie/TV content fetching (existing logic)
                const params = { page };
                if (genre) params.with_genres = genre;
                if (country) params.with_origin_country = country;

                if (tab === 'top_rated') {
                    params.sort_by = 'vote_average.desc';
                    params['vote_count.gte'] = 200;
                } else if (mediaType === 'movie' && tab === 'now_playing') {
                    data = await getNowPlayingMovies(page);
                } else if (mediaType === 'movie' && tab === 'upcoming') {
                    data = await getUpcomingMovies(page);
                } else if (mediaType === 'tv' && tab === 'on_the_air') {
                    data = await getOnTheAirTVShows(page);
                } else if (mediaType === 'tv' && tab === 'airing_today') {
                    data = await getAiringTodayTVShows(page);
                } else {
                    params.sort_by = 'popularity.desc';
                }

                if (!data) {
                    data = await discoverContent(mediaType, params);
                }
            }

            if (data && data.results) {
                if (page === 1) {
                    setContent(data.results);
                } else {
                    setContent(prev => [...prev, ...data.results]);
                }

                setTotalPages(data.totalPages || 1);
                setCurrentPage(page);
            } else {
                // Handle case where no data is returned
                if (page === 1) {
                    setContent([]);
                }
                setTotalPages(1);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab || selectedGenre || selectedCountry || selectedStudio) {
            fetchContent(activeTab, selectedGenre, selectedCountry, selectedStudio);
        } else {
            setActiveTab('popular');
        }
    }, [activeTab, selectedGenre, selectedCountry, selectedStudio, mediaType]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setCurrentPage(1);
    };

    const handleGenreChange = (genre) => {
        setSelectedGenre(genre);
        setCurrentPage(1);
    };

    const handleMediaTypeChange = (type) => {
        setMediaType(type);
        setSelectedGenre(null);
        setSelectedCountry(null);
        setSelectedStudio(null);
        setActiveTab('popular');
        setCurrentPage(1);
    };

    const handleStudioChange = (studio) => {
        setSelectedStudio(studio);
        setCurrentPage(1);
    };

    const loadMore = () => {
        if (currentPage < totalPages && !loading) {
            fetchContent(activeTab, selectedGenre, selectedCountry, selectedStudio, currentPage + 1);
        }
    };

    const getContentTypeLabel = () => {
        return mediaType === 'movie' ? 'Movies' : mediaType === 'tv' ? 'TV Series' : 'Anime';
    };

    const getSectionTitle = () => {
        const categoryLabel = currentTabs.find(t => t.id === activeTab)?.label || 'Popular';
        const genreLabel = selectedGenre ? getActiveGenreName() : '';
        const contentTypeLabel = getContentTypeLabel();

        if (selectedGenre && activeTab) {
            return `${categoryLabel} ${genreLabel} ${contentTypeLabel}`;
        } else if (selectedGenre) {
            return `${genreLabel} ${contentTypeLabel}`;
        } else {
            return `${categoryLabel} ${contentTypeLabel}`;
        }
    };

    const handleCountryChange = (countryCode) => {
        setSelectedCountry(countryCode);
        setCurrentPage(1);
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
                                            <button
                                                onClick={() => handleMediaTypeChange('anime')}
                                                className={`${styles.filterOption} ${mediaType === 'anime' ? styles.active : ''}`}
                                            >
                                                <FaPlay />
                                                Anime
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

                                    {/* Origin Country (only for movies and TV) */}
                                    {mediaType !== 'anime' && (
                                        <div className={styles.filterSection}>
                                            <h3 className={styles.filterSectionTitle}>Origin Country</h3>
                                            <div className={styles.filterOptions}>
                                                <button
                                                    onClick={() => handleCountryChange(null)}
                                                    className={`${styles.filterOption} ${!selectedCountry ? styles.active : ''}`}
                                                >
                                                    All Countries
                                                </button>
                                                {countryOptions.map((country) => (
                                                    <button
                                                        key={country.code}
                                                        onClick={() => handleCountryChange(country.code)}
                                                        className={`${styles.filterOption} ${selectedCountry === country.code ? styles.active : ''}`}
                                                    >
                                                        {country.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Studio Filter (only for anime) */}
                                    {mediaType === 'anime' && (
                                        <div className={styles.filterSection}>
                                            <h3 className={styles.filterSectionTitle}>Studio</h3>
                                            <div className={styles.filterOptions}>
                                                <button
                                                    onClick={() => handleStudioChange(null)}
                                                    className={`${styles.filterOption} ${!selectedStudio ? styles.active : ''}`}
                                                >
                                                    All Studios
                                                </button>
                                                {animeStudios.map((studio) => (
                                                    <button
                                                        key={studio}
                                                        onClick={() => handleStudioChange(studio)}
                                                        className={`${styles.filterOption} ${selectedStudio === studio ? styles.active : ''}`}
                                                    >
                                                        {studio}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

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
                                                    key={mediaType === 'anime' ? genre : genre.id}
                                                    onClick={() => handleGenreChange(mediaType === 'anime' ? genre : genre.id)}
                                                    className={`${styles.filterOption} ${selectedGenre === (mediaType === 'anime' ? genre : genre.id) ? styles.active : ''}`}
                                                >
                                                    {mediaType === 'anime' ? genre : genre.name}
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
                                <p className={styles.loadingText}>Loading {getContentTypeLabel().toLowerCase()}...</p>
                            </div>
                        </div>
                    ) : content.length > 0 ? (
                        <div className={styles.contentSection}>
                            <VerticalResults
                                items={content.map(item => ({ ...item, media_type: mediaType }))}
                                loading={loading && content.length > 0}
                                hasMore={currentPage < totalPages}
                                onLoadMore={loadMore}
                                emptyMessage={`No ${getContentTypeLabel().toLowerCase()} found. Try selecting a different category or genre.`}
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
                            <h3 className={styles.emptyTitle}>No {getContentTypeLabel().toLowerCase()} found</h3>
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