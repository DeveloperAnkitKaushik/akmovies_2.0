'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Topbar from '@/components/Topbar';
import VerticalResults from '@/components/VerticalResults';
import { searchMulti } from '@/utils/tmdb';
import { searchAnime, convertAnimeToMovieCard } from '@/utils/anilist';
import styles from './page.module.css';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const initialType = searchParams.get('type') === 'anime' ? 'anime' : 'movie';

    const [query, setQuery] = useState(initialQuery);
    const [searchType, setSearchType] = useState(initialType); // 'movie' | 'anime'
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // Dynamic title based on search query
    useEffect(() => {
        const scope = searchType === 'anime' ? 'Anime' : 'Movies & TV Shows';
        if (query.trim()) {
            document.title = `Search ${scope}: "${query}" | AKMovies`;
        } else {
            document.title = `Search ${scope} | AKMovies`;
        }
    }, [query, searchType]);

    const performSearch = async (searchQuery, page = 1) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            if (searchType === 'anime') {
                const pageData = await searchAnime(searchQuery, page, 20);
                const items = (pageData?.media || []).map(convertAnimeToMovieCard);
                if (page === 1) {
                    setResults(items);
                } else {
                    setResults(prev => [...prev, ...items]);
                }
                setTotalPages(pageData?.pageInfo?.lastPage || 1);
                setCurrentPage(pageData?.pageInfo?.currentPage || page);
            } else {
                const data = await searchMulti(searchQuery, page);
                const filtered = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
                if (page === 1) {
                    setResults(filtered);
                } else {
                    setResults(prev => [...prev, ...filtered]);
                }
                setTotalPages(data.totalPages || data.total_pages || 1);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim().length > 2) {
                performSearch(query.trim());
                // Update URL with query and type
                const url = `/search?type=${searchType}&q=${encodeURIComponent(query.trim())}`;
                window.history.pushState({}, '', url);
            } else if (query.trim().length === 0) {
                setResults([]);
                // Clear URL when query is empty but preserve type
                const url = `/search?type=${searchType}`;
                window.history.pushState({}, '', url);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, searchType]);

    // Trigger search when type changes and query is present
    useEffect(() => {
        if (query.trim().length > 2) {
            performSearch(query.trim(), 1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchType]);

    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);

    const handleLoadMore = async () => {
        if (currentPage < totalPages && !loading) {
            await performSearch(query, currentPage + 1);
        }
    };

    return (
        <div className={styles.container}>
            <Topbar name="Search Movies & TV Shows" />
            <div className={styles.content}>
                <div className="main-container">
                    {/* Search Form */}
                    <div className={styles.searchFormContainer}>
                        <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
                            <div className={styles.searchBarRow}>
                                <div className={styles.searchInputContainer}>
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={searchType === 'anime' ? 'Search for anime...' : 'Search for movies, TV shows...'}
                                        className={styles.searchInput}
                                        autoFocus
                                    />
                                    {loading && (
                                        <div className={styles.searchSpinner}></div>
                                    )}
                                </div>
                                <div className={styles.typeToggle} aria-label="Search type toggle">
                                    <span className={`${styles.toggleThumb} ${searchType === 'movie' ? styles.left : styles.right}`}></span>
                                    <button
                                        type="button"
                                        className={`${styles.toggleOption} ${searchType === 'movie' ? styles.active : ''}`}
                                        onClick={() => setSearchType('movie')}
                                    >
                                        Movies
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.toggleOption} ${searchType === 'anime' ? styles.active : ''}`}
                                        onClick={() => setSearchType('anime')}
                                    >
                                        Anime
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Search Results */}
                    {query && (
                        <div className={styles.resultsContainer}>
                            <div className={styles.resultsHeader}>
                                <h2 className={styles.resultsTitle}>
                                    {searchType === 'anime' ? 'Anime' : 'Movies & TV'} results for "{query}"
                                </h2>
                                {results.length > 0 && (
                                    <span className={styles.resultsCount}>
                                        {results.length} results found
                                    </span>
                                )}
                            </div>

                            <VerticalResults
                                items={results}
                                loading={loading && results.length === 0}
                                hasMore={currentPage < totalPages}
                                onLoadMore={handleLoadMore}
                                emptyMessage={`No results found for "${query}". Try searching with different keywords or check your spelling.`}
                                gridCols={6}
                                showLoadMore={results.length > 0}
                            />
                        </div>
                    )}

                    {/* Nothing to see template */}
                    {!query && (
                        <div className={styles.nothingToSee}>
                            <div className={styles.nothingToSeeContent}>
                                <div className={styles.nothingToSeeIcon}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                </div>
                                <h2 className={styles.nothingToSeeTitle}>Nothing to see</h2>
                                <p className={styles.nothingToSeeText}>
                                    Start typing to search for movies and TV shows
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}