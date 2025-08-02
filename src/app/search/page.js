'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Topbar from '@/components/Topbar';
import VerticalResults from '@/components/VerticalResults';
import { searchMulti } from '@/utils/tmdb';
import styles from './page.module.css';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // Dynamic title based on search query
    useEffect(() => {
        if (query.trim()) {
            document.title = `Search: "${query}" | AKMovies`;
        } else {
            document.title = 'Search Movies & TV Shows | AKMovies';
        }
    }, [query]);

    const performSearch = async (searchQuery, page = 1) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            const data = await searchMulti(searchQuery, page);

            if (page === 1) {
                setResults(data.results);
            } else {
                setResults(prev => [...prev, ...data.results]);
            }

            setTotalPages(data.totalPages);
            setCurrentPage(page);
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
                // Update URL with search query
                window.history.pushState({}, '', `/search?q=${encodeURIComponent(query.trim())}`);
            } else if (query.trim().length === 0) {
                setResults([]);
                // Clear URL when query is empty
                window.history.pushState({}, '', '/search');
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

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
                            <div className={styles.searchInputContainer}>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search for movies, TV shows..."
                                    className={styles.searchInput}
                                    autoFocus
                                />
                                {loading && (
                                    <div className={styles.searchSpinner}></div>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Search Results */}
                    {query && (
                        <div className={styles.resultsContainer}>
                            <div className={styles.resultsHeader}>
                                <h2 className={styles.resultsTitle}>
                                    Search results for "{query}"
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