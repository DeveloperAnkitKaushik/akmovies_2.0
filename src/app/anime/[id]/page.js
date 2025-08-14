'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import MovieCard from '@/components/MovieCard';
import MovieSection from '@/components/MovieSection';
import { getAnimeDetails, formatTimeUntilNext, formatDuration, convertAnimeToMovieCard } from '@/utils/anilist';
import { addToHistory, getContinueWatchingItem, updateContinueWatchingProgress, addRecommendation, addBookmark, removeBookmark, isBookmarked } from '@/utils/firestore';
import styles from './page.module.css';
import { IoIosPlayCircle } from "react-icons/io";
import { IoPlayForward } from "react-icons/io5";
import { IoPlayBack } from "react-icons/io5";
import { FaPlus, FaShare, FaYoutube, FaBookmark, FaRegBookmark, FaCalendar, FaClosedCaptioning, FaMicrophone } from "react-icons/fa";
import { isUserAdmin } from '@/utils/admin';

export default function AnimePage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { user, isAuthenticated } = useAuth();

    // Extract the actual ID from the combined id-name parameter
    const actualId = id ? id.split('-')[0] : null;

    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedEpisode, setSelectedEpisode] = useState(1);
    const [isDub, setIsDub] = useState(false);
    const [similarContent, setSimilarContent] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [trailerEmbedUrl, setTrailerEmbedUrl] = useState(null);
    const [bookmarked, setBookmarked] = useState(false);
    const [nextEpisodeInfo, setNextEpisodeInfo] = useState(null);
    const [currentEpisodePage, setCurrentEpisodePage] = useState(1);
    const [episodesPerPage] = useState(40);

    // Server configuration from environment variables
    const SERVER_URL = process.env.NEXT_PUBLIC_ANIME_SERVER_URL || 'https://your-anime-server.com';

    // Fetch anime details from AniList
    useEffect(() => {
        const fetchAnimeDetails = async () => {
            if (!actualId) return;

            try {
                setLoading(true);

                const anime = await getAnimeDetails(actualId);

                if (anime) {
                    setDetails(anime);
                    // Use only AniList trailer data
                    if (anime.trailer?.id && anime.trailer?.site) {
                        const site = anime.trailer.site.toLowerCase();
                        if (site === 'youtube') {
                            setTrailerEmbedUrl(`https://www.youtube.com/embed/${anime.trailer.id}`);
                        } else if (site === 'dailymotion') {
                            setTrailerEmbedUrl(`https://www.dailymotion.com/embed/video/${anime.trailer.id}`);
                        } else {
                            setTrailerEmbedUrl(null);
                        }
                    } else {
                        setTrailerEmbedUrl(null);
                    }

                    // Set next episode info
                    if (anime.nextAiringEpisode) {
                        setNextEpisodeInfo(anime.nextAiringEpisode);
                    }

                    // Get similar content from relations
                    const related = anime.relations?.edges
                        ?.filter(edge => edge.node.type === 'ANIME')
                        ?.slice(0, 10)
                        ?.map(edge => edge.node) || [];

                    setSimilarContent(related);

                    // Reset pagination to first page for new anime
                    setCurrentEpisodePage(1);
                }
            } catch (error) {
                console.error('Error fetching anime details:', error);
                toast.error('Failed to load anime details');
            } finally {
                setLoading(false);
            }
        };

        if (actualId) {
            fetchAnimeDetails();
        }
    }, [actualId]);

    // Check bookmark status
    useEffect(() => {
        const checkBookmarkStatus = async () => {
            if (!isAuthenticated || !user?.uid || !actualId) return;

            try {
                const bookmarkStatus = await isBookmarked(user.uid, parseInt(actualId), 'anime');
                setBookmarked(bookmarkStatus);
            } catch (error) {
                console.error('Error checking bookmark status:', error);
            }
        };

        checkBookmarkStatus();
    }, [actualId, isAuthenticated, user?.uid]);

    // Remove automatic history saving - only save on explicit user actions

    // Save to continue watching
    const saveToHistory = async (contentDetails, episodeNumber) => {
        if (!isAuthenticated || !user?.uid || !contentDetails) return;

        try {
            const historyItem = {
                id: parseInt(actualId),
                title: contentDetails.title.english || contentDetails.title.romaji,
                description: contentDetails.description,
                posterPath: contentDetails.coverImage?.large || contentDetails.coverImage?.medium || '',
                mediaType: 'anime',
                season: 1,
                episode: typeof episodeNumber === 'number' ? episodeNumber : selectedEpisode
            };

            console.log('Saving anime to history:', historyItem); // Debug log
            await addToHistory(user.uid, historyItem);
            console.log('Successfully saved anime to history'); // Debug log
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    };

    // Check for continue watching progress
    useEffect(() => {
        const checkContinueWatching = async () => {
            if (!isAuthenticated || !user?.uid || !actualId) return;

            try {
                const continueItem = await getContinueWatchingItem(user.uid, parseInt(actualId), 'anime');
                if (continueItem && continueItem.episode) {
                    setSelectedEpisode(continueItem.episode);

                    // Calculate and set the correct page for this episode
                    const episodeCount = details?.episodes || 1500;
                    const correctPage = Math.ceil(continueItem.episode / episodesPerPage);
                    setCurrentEpisodePage(correctPage);
                    console.log(`Auto-navigating to page ${correctPage} for episode ${continueItem.episode}`);
                }
            } catch (error) {
                console.error('Error checking continue watching:', error);
            }
        };

        checkContinueWatching();
    }, [isAuthenticated, user?.uid, actualId, details, episodesPerPage]);

    // Handle logout during playback
    useEffect(() => {
        if (!isAuthenticated && isPlaying) {
            setIsPlaying(false);
            toast.error('Please login to continue watching');
        }
    }, [isAuthenticated, isPlaying]);

    // Navigation functions for anime episodes
    const goToPreviousEpisode = () => {
        if (selectedEpisode > 1) {
            const newEpisode = selectedEpisode - 1;
            setSelectedEpisode(newEpisode);

            // Check if we need to go to previous page
            const currentPage = Math.ceil(selectedEpisode / episodesPerPage);
            const newPage = Math.ceil(newEpisode / episodesPerPage);
            if (newPage !== currentPage) {
                setCurrentEpisodePage(newPage);
            }

            if (isAuthenticated && user?.uid && details) {
                saveToHistory(details, newEpisode);
            }
        }
    };

    const goToNextEpisode = () => {
        const episodeCount = details?.episodes || 1500;
        if (selectedEpisode < episodeCount) {
            const newEpisode = selectedEpisode + 1;
            setSelectedEpisode(newEpisode);

            // Check if we need to go to next page
            const currentPage = Math.ceil(selectedEpisode / episodesPerPage);
            const newPage = Math.ceil(newEpisode / episodesPerPage);
            if (newPage !== currentPage) {
                setCurrentEpisodePage(newPage);
            }

            if (isAuthenticated && user?.uid && details) {
                saveToHistory(details, newEpisode);
            }
        }
    };

    // Check if navigation buttons should be disabled
    const canGoPrevious = () => {
        return selectedEpisode > 1;
    };

    const canGoNext = () => {
        const episodeCount = details?.episodes || 1500;
        return selectedEpisode < episodeCount;
    };

    // Pagination functions for episodes
    const goToPreviousEpisodePage = () => {
        if (currentEpisodePage > 1) {
            setCurrentEpisodePage(currentEpisodePage - 1);
        }
    };

    const goToNextEpisodePage = () => {
        const episodeCount = details?.episodes || 1500; // Default to 1500 for ongoing series (covers One Piece 1140+)
        const totalPages = Math.ceil(episodeCount / episodesPerPage);
        if (currentEpisodePage < totalPages) {
            setCurrentEpisodePage(currentEpisodePage + 1);
        }
    };

    const canGoPreviousPage = () => {
        return currentEpisodePage > 1;
    };

    const canGoNextPage = () => {
        const episodeCount = details?.episodes || 1500; // Default to 1500 for ongoing series (covers One Piece 1140+)
        const totalPages = Math.ceil(episodeCount / episodesPerPage);
        return currentEpisodePage < totalPages;
    };

    // Get player URL based on environment variable and dub preference
    const getPlayerUrl = () => {
        const serverUrl = SERVER_URL;
        if (!serverUrl) return '';

        const dubQuery = isDub ? '&dub=true' : '';
        return `${serverUrl}/anime/${actualId}/${selectedEpisode}/?color=e94560&autoplay=true&primarycolor=e94560&server=13${dubQuery}`;
    };

    // Handle play button click
    const handlePlayClick = () => {
        if (!isAuthenticated) {
            toast.error('Please login first to watch this content');
            return;
        }

        setIsPlaying(true);
        // Save to continue watching when play button is clicked (same as watch page)
        if (isAuthenticated && user?.uid && details) {
            saveToHistory(details, selectedEpisode);
        }
    };

    // Format description: strip HTML tags, normalize whitespace, then limit to 50 words
    const formatDescription = (text) => {
        if (!text) return '';
        const withoutTags = String(text)
            .replace(/<br\s*\/?\s*>/gi, ' ') // replace <br> with space
            .replace(/<[^>]*>/g, '') // strip any remaining HTML tags
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/\s+/g, ' ') // collapse whitespace
            .trim();

        const words = withoutTags.split(' ');
        const preview = words.slice(0, 50).join(' ');
        return preview + (words.length > 50 ? '…' : '');
    };



    // Handle episode selection
    const handleEpisodeSelect = async (episodeNumber) => {
        setSelectedEpisode(episodeNumber);

        // Calculate and navigate to the correct page for this episode
        const episodeCount = details?.episodes || 1500;
        const correctPage = Math.ceil(episodeNumber / episodesPerPage);
        if (correctPage !== currentEpisodePage) {
            setCurrentEpisodePage(correctPage);
        }

        // Manual episode change should save to history (like watch page behavior)
        if (isAuthenticated && user?.uid && details) {
            saveToHistory(details, episodeNumber);
        }
    };

    // Handle add to recommendations (admin only)
    const handleAddRecommendation = async () => {
        if (!isAuthenticated || !user?.uid || !details) return;

        // Check if user is admin
        if (!isUserAdmin(user)) {
            toast.error('Only admin can add recommendations');
            return;
        }

        try {
            const recommendationData = {
                id: parseInt(actualId),
                title: details.title.english || details.title.romaji,
                description: details.description,
                posterPath: details.coverImage.large,
                mediaType: 'anime',
                addedBy: user.email
            };

            await addRecommendation(recommendationData);
        } catch (error) {
            console.error('Error adding recommendation:', error);
        }
    };

    // Handle share functionality
    const handleShare = async () => {
        const currentUrl = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: details?.title?.english || details?.title?.romaji || 'Check out this anime',
                    text: `Watch ${details?.title?.english || details?.title?.romaji} on akmovies`,
                    url: currentUrl
                });
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(currentUrl);
                toast.success('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(currentUrl);
                toast.success('Link copied to clipboard!');
            } catch (clipboardError) {
                toast.error('Failed to share');
            }
        }
    };

    // Handle bookmark functionality
    const handleBookmarkClick = async () => {
        if (!isAuthenticated) {
            toast.error('Please login first to bookmark content');
            return;
        }

        if (!details) return;

        try {
            if (bookmarked) {
                // Remove bookmark
                const success = await removeBookmark(user.uid, parseInt(actualId), 'anime');
                if (success) {
                    setBookmarked(false);
                    // Trigger global bookmark refresh
                    window.dispatchEvent(new CustomEvent('bookmarkChanged'));
                }
            } else {
                // Add bookmark
                const bookmarkData = {
                    id: parseInt(actualId),
                    title: details.title.english || details.title.romaji,
                    overview: details.description,
                    posterPath: details.coverImage.large,
                    backdropPath: details.bannerImage,
                    mediaType: 'anime',
                    releaseDate: `${details.seasonYear}-${details.season || 'UNKNOWN'}`,
                    voteAverage: details.averageScore / 10 // Convert from 0-100 to 0-10 scale
                };

                const success = await addBookmark(user.uid, bookmarkData);
                if (success) {
                    setBookmarked(true);
                    // Trigger global bookmark refresh
                    window.dispatchEvent(new CustomEvent('bookmarkChanged'));
                }
            }
        } catch (error) {
            console.error('Error handling bookmark:', error);
            toast.error('Failed to update bookmark');
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingContent}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>Loading anime details...</p>
                </div>
            </div>
        );
    }

    if (!details) {
        return (
            <div className={styles.errorContainer}>
                <h1>Anime not found</h1>
                <a href="/">Go back home</a>
            </div>
        );
    }

    const title = details.title.english || details.title.romaji;
    const releaseDate = details.seasonYear;
    const duration = details.duration;

    return (
        <div className={styles.container}>
            <div className={styles.bgoverlay}>
                <div className={styles.overlay}></div>
                <div className={styles.backdrop} style={{ backgroundImage: `url(${details.bannerImage != null ? details.bannerImage : '/anime_placeholder.jpg'})` }}></div>
            </div>
            <div className='main-container'>
                <div className={styles.innercontainer}>
                    <div className={styles.infocontainer}>
                        <div className={styles.imagecontainer}>
                            <img src={details.coverImage.large} alt={title} />
                        </div>
                        <div className={styles.infocontent}>
                            <div className={styles.title}>{title}</div>
                            <div className={styles.metadata}>
                                {details.averageScore > 0 && (
                                    <span className={styles.ratingItem}>
                                        <span className={styles.star}>★</span>
                                        {(details.averageScore / 10).toFixed(1)}
                                    </span>
                                )}
                                <div className={styles.ageRating}>
                                    {details.format?.toUpperCase() || 'TV'}
                                </div>
                                <div className={styles.releasedate}>
                                    {releaseDate || 'N/A'}
                                </div>
                                {duration && (
                                    <div className={styles.releasedate}>
                                        {formatDuration(duration)}
                                    </div>
                                )}
                            </div>
                            <div className={styles.description}>
                                {formatDescription(details.description)}
                            </div>
                            <div className={styles.genres}>
                                {details.genres?.slice(0, 5).map((genre) => (
                                    <button
                                        key={genre}
                                        className={styles.genreTag}
                                        onClick={() => router.push(`/browse?type=anime&genre=${encodeURIComponent(genre)}`)}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.maininfo}>
                                <div className={`${styles.maininfocolumn}`}>
                                    <div className={styles.label}>
                                        <span>Country:</span> {details.countryOfOrigin || 'Japan'}
                                    </div>
                                    <div className={styles.label}>
                                        <span>Released:</span> {details.season} {details.seasonYear}
                                    </div>
                                    <div className={styles.label}>
                                        <span>Studio: </span>
                                        <span style={{ color: 'rgb(204, 204, 204)' }}>
                                            {details.studios.nodes[0].name}
                                        </span>
                                    </div>
                                </div>
                                <div className={`${styles.maininfocolumn}`}>
                                    <div className={styles.label}>
                                        <span>Episodes:</span> {details.episodes || 'Ongoing'}
                                    </div>
                                    <div className={styles.label}>
                                        <span>Status:</span> {details.status}
                                    </div>
                                    <div className={styles.label}>
                                        <span>Popularity:</span> #{details.popularity}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}

                            <div className={styles.actionButtons}>
                                {trailerEmbedUrl && (
                                    <button
                                        className={styles.shareButton}
                                        onClick={() => setShowTrailer(true)}
                                        title="Watch Trailer"
                                    >
                                        ▶ Trailer
                                    </button>
                                )}
                                {nextEpisodeInfo && (
                                    <button className={styles.nextEpisodeButton}>
                                        <FaCalendar /> Next Episode in {formatTimeUntilNext(nextEpisodeInfo.timeUntilAiring)}
                                    </button>
                                )}
                                <button
                                    className={styles.bookmarkButton}
                                    onClick={handleBookmarkClick}
                                >
                                    {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
                                    {bookmarked ? 'Bookmarked' : 'Bookmark'}
                                </button>
                                <button
                                    className={styles.shareButton}
                                    onClick={handleShare}
                                >
                                    <FaShare /> Share
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Server Selection */}
                    <div className={styles.warningtext}>Use Adblocker</div>

                    {/* Player Section */}
                    <div className={styles.playerSection}>
                        {!isPlaying ? (
                            <div className={styles.playerContainer} style={{ backgroundImage: `url(${details.bannerImage != null ? details.bannerImage : '/anime_placeholder.jpg'})` }}>
                                <div className={styles.videoPlayBtn} onClick={handlePlayClick}>
                                    <IoIosPlayCircle className={styles.playIcon} />
                                </div>
                            </div>
                        ) : (
                            <div className={styles.playerContainer}>
                                <iframe
                                    src={getPlayerUrl()}
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    allowFullScreen
                                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                                    sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"
                                    referrerPolicy="no-referrer"
                                    onError={() => {
                                        toast.error('Failed to load video. Please try refreshing the page.');
                                        setIsPlaying(false);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Trailer Modal */}
                    {showTrailer && trailerEmbedUrl && (
                        <div className={styles.trailerOverlay} onClick={() => setShowTrailer(false)}>
                            <div className={styles.trailerModal} onClick={(e) => e.stopPropagation()}>
                                <button className={styles.closeTrailer} onClick={() => setShowTrailer(false)} aria-label="Close trailer">×</button>
                                <iframe
                                    className={styles.trailerIframe}
                                    src={`${trailerEmbedUrl}?autoplay=1&rel=0`}
                                    title="Trailer"
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.optionsContainer}>
                        <button
                            className={`${styles.controlbtncontainer} ${!canGoPrevious() ? styles.disabled : ''}`}
                            onClick={goToPreviousEpisode}
                            disabled={!canGoPrevious()}
                        >
                            <IoPlayBack /> Previous
                        </button>

                        <button
                            className={`${styles.controlbtncontainer} ${!canGoNext() ? styles.disabled : ''}`}
                            onClick={goToNextEpisode}
                            disabled={!canGoNext()}
                        >
                            Next <IoPlayForward />
                        </button>
                    </div>

                    <div className={styles.serverpara}>Choose your preferred audio language</div>
                    <div className={styles.serverButtons}>
                        <button
                            className={`${styles.serverButton} ${!isDub ? styles.active : ''}`}
                            onClick={() => setIsDub(false)}
                        >
                            <FaClosedCaptioning /> Sub
                        </button>
                        <button
                            className={`${styles.serverButton} ${isDub ? styles.active : ''}`}
                            onClick={() => setIsDub(true)}
                        >
                            <FaMicrophone /> Dub
                        </button>
                    </div>

                    {/* Admin Actions */}
                    {isAuthenticated && isUserAdmin(user) && (
                        <div className={styles.adminActions}>
                            <button
                                className={styles.adminButton}
                                onClick={handleAddRecommendation}
                                title="Add to recommendations (Admin only)"
                            >
                                <FaPlus /> Add
                            </button>
                        </div>
                    )}

                    {/* Episode Selection for Anime */}
                    {(() => {
                        console.log('Debug episodes data:', {
                            episodes: details.episodes,
                            status: details.status,
                            nextAiringEpisode: details.nextAiringEpisode,
                            hasEpisodes: details.episodes > 0 || details.status === 'RELEASING' || details.status === 'FINISHED'
                        });

                        // Show episodes section if we have episode count OR if it's an ongoing/finished series
                        const shouldShowEpisodes = details.episodes > 0 || details.status === 'RELEASING' || details.status === 'FINISHED';

                        if (!shouldShowEpisodes) return null;

                        // For ongoing series without episode count, assume it has episodes
                        const episodeCount = details.episodes || 1500; // Default to 1500 for ongoing series (covers One Piece 1140+)

                        return (
                            <div className={styles.episodeSection}>
                                <div className={styles.episodeHeader}>
                                    <h3>Episodes {details.episodes ? `(${details.episodes})` : '(Ongoing)'}</h3>
                                    {episodeCount > episodesPerPage && (
                                        <div className={styles.episodePagination}>
                                            <button
                                                className={`${styles.episodePageButton} ${!canGoPreviousPage() ? styles.disabled : ''}`}
                                                onClick={goToPreviousEpisodePage}
                                                disabled={!canGoPreviousPage()}
                                            >
                                                <IoPlayBack /> Prev Page
                                            </button>
                                            <span className={styles.episodePageInfo}>
                                                Page {currentEpisodePage} of {Math.ceil(episodeCount / episodesPerPage)}
                                            </span>
                                            <button
                                                className={`${styles.episodePageButton} ${!canGoNextPage() ? styles.disabled : ''}`}
                                                onClick={goToNextEpisodePage}
                                                disabled={!canGoNextPage()}
                                            >
                                                Next Page <IoPlayForward />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.episodeGrid}>
                                    {Array.from({ length: episodeCount }, (_, i) => i + 1)
                                        .slice((currentEpisodePage - 1) * episodesPerPage, currentEpisodePage * episodesPerPage)
                                        .map((episodeNumber) => {
                                            // Check if episode has aired (for ongoing series)
                                            const hasAired = details.status === 'FINISHED' ||
                                                (details.status === 'RELEASING' && episodeNumber <= selectedEpisode) ||
                                                episodeNumber <= (details.nextAiringEpisode?.episode || 0);

                                            return (
                                                <div
                                                    key={episodeNumber}
                                                    className={`${styles.episodeBox} ${selectedEpisode === episodeNumber ? styles.activeEpisode : ''} ${!hasAired ? styles.lockedEpisode : ''}`}
                                                    onClick={() => hasAired && handleEpisodeSelect(episodeNumber)}
                                                >
                                                    {!hasAired && <span className={styles.lockIcon}>🔒</span>}
                                                    EP {episodeNumber}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Related Seasons Section */}
                    {similarContent.length > 0 && (
                        <div className={styles.relatedSection}>
                            <div className={styles.relatedHeader}>
                                <div className={styles.relatedTitleBar}></div>
                                <h3>You May Like</h3>
                            </div>
                            <MovieSection
                                title=""
                                items={similarContent.map(anime => convertAnimeToMovieCard(anime))}
                                type="anime"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
