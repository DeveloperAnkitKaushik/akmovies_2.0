'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, signOutUser } from '@/utils/auth';
import { FaUser, FaSignOutAlt, FaSearch, FaTimes } from 'react-icons/fa';
import { searchMulti } from '@/utils/tmdb';
import { searchAnime, convertAnimeToMovieCard } from '@/utils/anilist';
import styles from './index.module.css';
import { FaArrowRight } from "react-icons/fa";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchType, setSearchType] = useState('movie'); // 'movie' | 'anime'
    const [isSearching, setIsSearching] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Cleanup
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim().length > 2) {
                performSearch(searchQuery.trim());
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchType]);

    const performSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setIsSearching(true);
            if (searchType === 'anime') {
                const pageData = await searchAnime(query, 1, 10);
                const items = (pageData?.media || []).map(convertAnimeToMovieCard).slice(0, 4);
                setSearchResults(items);
            } else {
                const data = await searchMulti(query, 1);
                const filtered = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 4);
                setSearchResults(filtered);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (!isSearchOpen) {
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setIsSearchOpen(false);
            router.push(`/search?type=${searchType === 'anime' ? 'anime' : 'movie'}&q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleResultClick = (item) => {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);

        const title = item.title || item.name;
        const isAnime = item.media_type === 'anime' || item.mediaType === 'anime';
        const mediaType = isAnime ? 'anime' : (item.media_type || (item.title ? 'movie' : 'tv'));
        const formattedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (isAnime) {
            router.push(`/anime/${item.id}-${formattedTitle}`);
        } else {
            router.push(`/watch/${mediaType}/${item.id}-${formattedTitle}`);
        }
    };

    const handleAuthClick = async () => {
        if (isAuthenticated) {
            // User is signed in, show sign out option
            try {
                await signOutUser();
            } catch (error) {
                console.error('Sign out error:', error);
            }
        } else {
            // User is not signed in, sign in with Google
            setIsSigningIn(true);
            try {
                await signInWithGoogle();
            } catch (error) {
                console.error('Sign in error:', error);
            } finally {
                setIsSigningIn(false);
            }
        }
    };

    return (
        <>
            <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
                <div className={`main-container ${styles.navContainer}`}>
                    <div className={styles.navLeft}>
                        <button
                            className={`${styles.hamburger} ${isMenuOpen ? styles.active : ''}`}
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        <button
                            className={styles.searchButton}
                            onClick={toggleSearch}
                            aria-label="Search"
                        >
                            <FaSearch className={styles.searchIcon} />
                        </button>
                    </div>

                    {/* Logo - Centered */}
                    <div className={styles.logoContainer}>
                        <Link href="/" className={styles.logo}>
                            <img src="/logo.png" alt="logo" className={styles.logoImage} />
                        </Link>
                    </div>

                    {/* Auth Button */}
                    <div className={styles.authContainer}>
                        <button
                            className={`${styles.authButton} ${isSigningIn ? styles.loading : ''}`}
                            onClick={handleAuthClick}
                            disabled={isSigningIn}
                            aria-label={isAuthenticated ? "Sign out" : "Sign in"}
                        >
                            {isSigningIn ? (
                                <div className={styles.spinner}></div>
                            ) : isAuthenticated ? (
                                <>
                                    {user?.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || 'User'}
                                            className={styles.userAvatar}
                                        />
                                    ) : (
                                        <FaUser className={styles.authIcon} />
                                    )}
                                    <span className={styles.authText}>{user?.displayName || 'User'}</span>
                                    <FaSignOutAlt className={styles.signOutIcon} />
                                </>
                            ) : (
                                <>
                                    <FaUser className={styles.authIcon} />
                                    <span className={styles.authText}>Login</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu Backdrop */}
                    {isMenuOpen && (
                        <div className={styles.mobileMenuBackdrop} onClick={toggleMenu}></div>
                    )}

                    {/* Mobile Menu */}
                    <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
                        <Link href="/" className={styles.mobileNavLink} onClick={toggleMenu}>Home</Link>
                        <Link href="/browse" className={styles.mobileNavLink} onClick={toggleMenu}>Browse</Link>
                        {isAuthenticated && (
                            <Link href="/continue" className={styles.mobileNavLink} onClick={toggleMenu}>Continue</Link>
                        )}
                        {isAuthenticated && user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                            <Link href="/admin" className={styles.mobileNavLink} onClick={toggleMenu}>Admin</Link>
                        )}
                        {isAuthenticated && (
                            <div className={styles.mobileUserInfo}>
                                <div className={styles.mobileUserAvatar}>
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName || 'User'} />
                                    ) : (
                                        <FaUser />
                                    )}
                                </div>
                                <span className={styles.mobileUserName}>{user?.displayName || 'User'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Search Popup */}
            {isSearchOpen && (
                <div className={styles.searchPopup}>
                    <div className={styles.searchPopupBackdrop} onClick={toggleSearch}></div>
                    <div className={styles.searchPopupContent}>
                        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                            <div className={styles.searchBarRow}>
                                <div className={styles.searchInputContainer}>
                                    <FaSearch className={styles.searchInputIcon} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={searchType === 'anime' ? 'Search anime...' : 'Search movies, TV shows...'}
                                        className={styles.searchInput}
                                        autoFocus
                                    />
                                    {isSearching && (
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

                        {/* Search Results */}
                        {searchQuery.trim().length > 2 && (
                            <div className={styles.searchResults}>
                                {isSearching ? (
                                    <div className={styles.searchLoading}>
                                        <div className={styles.searchLoadingSpinner}></div>
                                        <span>Searching...</span>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <>
                                        <div className={styles.searchResultsHeader}>
                                            <span>Quick Results</span>
                                            <button
                                                onClick={handleSearchSubmit}
                                                className={styles.viewAllButton}
                                            >
                                                View All Results <FaArrowRight />
                                            </button>
                                        </div>
                                        <div className={styles.searchResultsList}>
                                            {searchResults.map((item) => (
                                                <div
                                                    key={item.uniqueKey || item.id}
                                                    className={styles.searchResultItem}
                                                    onClick={() => handleResultClick(item)}
                                                >
                                                    <div className={styles.searchResultImage}>
                                                        <img
                                                            src={(item.media_type === 'anime' || item.mediaType === 'anime')
                                                                ? (item.poster_path || '/placeholder-movie.jpg')
                                                                : (item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : '/placeholder-movie.jpg')}
                                                            alt={item.title || item.name}
                                                        />
                                                    </div>
                                                    <div className={styles.searchResultInfo}>
                                                        <h3>{item.title || item.name}</h3>
                                                        <p>{(item.media_type === 'anime' || item.mediaType === 'anime') ? 'anime' : (item.media_type || (item.title ? 'movie' : 'tv'))}</p>
                                                        {item.release_date && (
                                                            <span>{new Date(item.release_date).getFullYear()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : searchQuery.trim().length > 2 ? (
                                    <div className={styles.noResults}>
                                        <span>No results found for "{searchQuery}"</span>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar; 