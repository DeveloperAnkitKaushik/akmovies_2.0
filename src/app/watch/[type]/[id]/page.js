'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaPlay, FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import MovieCard from '@/components/MovieCard';
import MovieSection from '@/components/MovieSection';
import { getMovieDetails, getTVShowDetails, getImageUrl, getTitleLogo } from '@/utils/tmdb';
import { addToHistory, getServers, getContinueWatchingItem, updateContinueWatchingProgress, addRecommendation } from '@/utils/firestore';
import styles from './page.module.css';
import { IoIosPlayCircle } from "react-icons/io";
import { IoPlayForward } from "react-icons/io5";
import { IoPlayBack } from "react-icons/io5";
import { FaCloudBolt } from "react-icons/fa6";
import { FaPlus, FaShare, FaYoutube } from "react-icons/fa";
import { isUserAdmin } from '@/utils/admin';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const { type, id } = params;
  const { user, isAuthenticated } = useAuth();

  // Extract the actual ID from the combined id-name parameter
  const actualId = id ? id.split('-')[0] : null;

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [selectedServer, setSelectedServer] = useState(1);
  const [similarContent, setSimilarContent] = useState([]);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [servers, setServers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [titleLogo, setTitleLogo] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);

  // PWA Orientation Control
  useEffect(() => {
    // Lock orientation to portrait when not playing
    const lockOrientation = () => {
      if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.lock) {
        if (!isPlaying) {
          screen.orientation.lock('portrait').catch(() => {
            // Ignore errors if orientation lock is not supported
          });
        } else {
          // Allow landscape when playing
          screen.orientation.unlock();
        }
      }
    };

    lockOrientation();

    // Cleanup on unmount
    return () => {
      if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, [isPlaying]);

  // Fetch title logo
  useEffect(() => {
    const fetchTitleLogo = async () => {
      if (!actualId || !type) return;

      try {
        const logoUrl = await getTitleLogo(type, parseInt(actualId));
        if (logoUrl) {
          setTitleLogo(logoUrl);
        }
      } catch (error) {
        console.error('Error fetching title logo:', error);
      }
    };

    fetchTitleLogo();
  }, [actualId, type]);

  // Save to continue watching
  const saveToHistory = async (contentDetails) => {
    if (!isAuthenticated || !user?.uid || !contentDetails) return;

    try {
      const historyItem = {
        id: parseInt(actualId),
        title: contentDetails.title || contentDetails.name,
        description: contentDetails.overview,
        posterPath: contentDetails.poster_path,
        mediaType: type,
        season: type === 'tv' ? selectedSeason : 1,
        episode: type === 'tv' ? selectedEpisode : 1
      };

      await addToHistory(user.uid, historyItem);
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  // Fetch servers from Firebase
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const serversData = await getServers();
        setServers(serversData);
        if (serversData.length > 0) {
          setSelectedServer(serversData[0].id);
        }
      } catch (error) {
        console.error('Error fetching servers:', error);
        // Set default servers as fallback
        const defaultServers = [
          { id: '1', name: 'Server 1', url: 'https://vidsrc.cc/embed', order_number: 1 },
          { id: '2', name: 'Server 2', url: 'https://vidsrc.to/embed', order_number: 2 },
          { id: '3', name: 'Server 3', url: 'https://vidsrc.me/embed', order_number: 3 }
        ];
        setServers(defaultServers);
        setSelectedServer('1');
      }
    };

    fetchServers();
  }, []);

  // Check for continue watching progress
  useEffect(() => {
    const checkContinueWatching = async () => {
      if (!isAuthenticated || !user?.uid || !actualId || type !== 'tv') return;

      try {
        const continueItem = await getContinueWatchingItem(user.uid, parseInt(actualId), type);
        if (continueItem && continueItem.season && continueItem.episode) {
          setSelectedSeason(continueItem.season);
          setSelectedEpisode(continueItem.episode);
        }
      } catch (error) {
        console.error('Error checking continue watching:', error);
      }
    };

    checkContinueWatching();
  }, [isAuthenticated, user?.uid, actualId, type]);

  // Handle logout during playback
  useEffect(() => {
    if (!isAuthenticated && isPlaying) {
      setIsPlaying(false);
      toast.error('Please login to continue watching');
    }
  }, [isAuthenticated, isPlaying]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        let data;

        if (type === 'movie') {
          data = await getMovieDetails(actualId);
        } else if (type === 'tv') {
          data = await getTVShowDetails(actualId);
        }

        setDetails(data);

        // Extract trailer key from videos
        if (data?.videos?.results) {
          const trailer = data.videos.results.find(
            video => video.type === 'Trailer' && video.site === 'YouTube'
          );
          if (trailer) {
            setTrailerKey(trailer.key);
          }
        }

        // Fetch similar content
        if (data?.similar?.results) {
          setSimilarContent(data.similar.results.slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching details:', error);
        toast.error('Failed to load content details');
      } finally {
        setLoading(false);
      }
    };

    if (actualId && type) {
      fetchDetails();
    }
  }, [actualId, type]);

  // Navigation functions for TV series
  const goToPreviousEpisode = async () => {
    if (type !== 'tv' || !details?.seasons) return;

    const currentSeason = details.seasons.find(s => s.season_number === selectedSeason);
    const prevSeason = details.seasons.find(s => s.season_number === selectedSeason - 1);

    let newSeason = selectedSeason;
    let newEpisode = selectedEpisode;

    if (selectedEpisode > 1) {
      // Same season, previous episode
      newEpisode = selectedEpisode - 1;
    } else if (prevSeason) {
      // Previous season, last episode
      newSeason = selectedSeason - 1;
      newEpisode = prevSeason.episode_count;
    }

    setSelectedSeason(newSeason);
    setSelectedEpisode(newEpisode);

    // Update continue watching progress
    if (isAuthenticated && user?.uid && details) {
      await updateContinueWatchingProgress(user.uid, parseInt(actualId), type, newSeason, newEpisode);
      // Also save to history when navigating
      saveToHistory(details);
    }
  };

  const goToNextEpisode = async () => {
    if (type !== 'tv' || !details?.seasons) return;

    const currentSeason = details.seasons.find(s => s.season_number === selectedSeason);
    const nextSeason = details.seasons.find(s => s.season_number === selectedSeason + 1);

    let newSeason = selectedSeason;
    let newEpisode = selectedEpisode;

    if (selectedEpisode < currentSeason.episode_count) {
      // Same season, next episode
      newEpisode = selectedEpisode + 1;
    } else if (nextSeason) {
      // Next season, first episode
      newSeason = selectedSeason + 1;
      newEpisode = 1;
    }

    setSelectedSeason(newSeason);
    setSelectedEpisode(newEpisode);

    // Update continue watching progress
    if (isAuthenticated && user?.uid && details) {
      await updateContinueWatchingProgress(user.uid, parseInt(actualId), type, newSeason, newEpisode);
      // Also save to history when navigating
      saveToHistory(details);
    }
  };

  // Check if navigation buttons should be disabled
  const canGoPrevious = () => {
    if (type !== 'tv' || !details?.seasons) return false;

    const firstSeason = details.seasons.find(s => s.season_number > 0);
    return !(selectedSeason === firstSeason?.season_number && selectedEpisode === 1);
  };

  const canGoNext = () => {
    if (type !== 'tv' || !details?.seasons) return false;

    const currentSeason = details.seasons.find(s => s.season_number === selectedSeason);
    const lastSeason = details.seasons[details.seasons.length - 1];

    return !(selectedSeason === lastSeason?.season_number && selectedEpisode === currentSeason?.episode_count);
  };

  // Get player URL based on selected server
  const getPlayerUrl = () => {
    const server = servers.find(s => s.id === selectedServer);
    if (!server) return '';

    if (type === 'movie') {
      return `${server.url}/movie/${actualId}/?color=e94560&autoplay=true&primarycolor=e94560&server=13`;
    } else {
      return `${server.url}/tv/${actualId}/${selectedSeason}/${selectedEpisode}/?color=e94560&autoplay=true&primarycolor=e94560&server=13`;
    }
  };

  // Handle play button click
  const handlePlayClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login first to watch this content');
      return;
    }

    setIsPlaying(true);
    // Save to continue watching when play button is clicked
    if (isAuthenticated && user?.uid && details) {
      saveToHistory(details);
    }
  };

  // Format description (limit to 50 words)
  const formatDescription = (text) => {
    if (!text) return '';
    const words = text.split(' ');
    return words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');
  };

  // Format runtime
  const formatRuntime = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get content rating
  const getContentRating = () => {
    if (type === 'movie') {
      return details?.release_dates?.results?.find(r => r.iso_3166_1 === 'US')?.release_dates?.[0]?.certification || 'PG-13';
    } else {
      return details?.content_ratings?.results?.find(r => r.iso_3166_1 === 'US')?.rating || 'TV-14';
    }
  };

  // Handle season selection
  const handleSeasonSelect = async (seasonNumber) => {
    setSelectedSeason(seasonNumber);
    setSelectedEpisode(1);
    setShowSeasonDropdown(false);

    // Update continue watching progress
    if (isAuthenticated && user?.uid) {
      await updateContinueWatchingProgress(user.uid, parseInt(actualId), type, seasonNumber, 1);
    }
  };

  // Handle episode selection
  const handleEpisodeSelect = async (episodeNumber) => {
    setSelectedEpisode(episodeNumber);

    // Update continue watching progress
    if (isAuthenticated && user?.uid && actualId) {
      await updateContinueWatchingProgress(user.uid, parseInt(actualId), type, selectedSeason, episodeNumber);
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
        title: details.title || details.name,
        description: details.overview,
        posterPath: details.poster_path,
        mediaType: type,
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
          title: details?.title || details?.name || 'Check out this content',
          text: `Watch ${details?.title || details?.name} on akmovies`,
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

  const handleTrailerClick = () => {
    if (trailerKey) {
      setShowTrailer(true);
    } else {
      toast.error('No trailer available for this content');
    }
  };

  const closeTrailer = () => {
    setShowTrailer(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading details...</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className={styles.errorContainer}>
        <h1>Content not found</h1>
        <a href="/">Go back home</a>
      </div>
    );
  }

  const title = details.title || details.name;
  const releaseDate = details.release_date || details.first_air_date;
  const runtime = details.runtime || (details.episode_run_time && details.episode_run_time[0]);

  return (
    <div className={styles.container}>
      {/* Trailer Modal */}
      {showTrailer && trailerKey && (
        <div className={styles.trailerOverlay} onClick={closeTrailer}>
          <div className={styles.trailerModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeTrailer} onClick={closeTrailer}>
              ×
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=0`}
              title="Trailer"
              frameBorder="0"

              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.trailerIframe}
            />
          </div>
        </div>
      )}
      <div className={styles.bgoverlay}>
        <div className={styles.overlay}></div>
        <div className={styles.backdrop} style={{ backgroundImage: `url(${getImageUrl(details.backdrop_path, 'original')})` }}></div>
      </div>
      <div className='main-container'>
        <div className={styles.innercontainer}>
          <div className={styles.infocontainer}>
            <div className={styles.imagecontainer}>
              <img src={getImageUrl(details.poster_path, 'w500')} alt={title} />
            </div>
            <div className={styles.infocontent}>
              {/* Title Logo or Text */}
              {titleLogo ? (
                <div className={styles.titleLogoContainer}>
                  <img
                    src={titleLogo}
                    alt={title}
                    className={styles.titleLogo}
                  />
                </div>
              ) : (
                <div className={styles.title}>{title}</div>
              )}
              <div className={styles.metadata}>
                {details.vote_average > 0 && (
                  <span className={styles.ratingItem}>
                    <span className={styles.star}>★</span>
                    {details.vote_average.toFixed(1)}
                  </span>
                )}
                <div className={styles.ageRating}>
                  {getContentRating()}
                </div>
                <div className={styles.releasedate}>
                  {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
                </div>
                {runtime && (
                  <div className={styles.releasedate}>
                    {formatRuntime(runtime)}
                  </div>
                )}
              </div>
              <div className={styles.description}>
                {formatDescription(details.overview)}
              </div>
              <div className={styles.genres}>
                {details.genres?.slice(0, 5).map((genre) => (
                  <a
                    key={genre.id}
                    href={`/browse?genre=${genre.id}&type=${type}`}
                    className={styles.genreTag}
                  >
                    {genre.name}
                  </a>
                ))}
              </div>
              <div className={styles.maininfo}>
                <div className={`${styles.maininfocolumn}`}>
                  <div className={styles.label}>
                    <span>Country:</span> {details.production_countries?.[0]?.name || 'United States'}
                  </div>
                  <div className={styles.label}>
                    <span>Released Date:</span> {releaseDate ? new Date(releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </div>
                  <div className={styles.label}>
                    <span>Production:</span> {details.production_companies?.[0]?.name || 'N/A'}
                  </div>
                </div>
                <div className={`${styles.maininfocolumn}`}>
                  <div className={styles.label}>
                    <span>Directors:</span> {details.credits?.crew?.filter(c => c.job === 'Director').slice(0, 3).map(d => d.name).join(', ') || 'N/A'}
                  </div>
                  <div className={styles.label}>
                    <span>Cast:</span> {details.credits?.cast?.slice(0, 3).map(a => a.name).join(', ') || 'N/A'}
                  </div>
                </div>
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={styles.trailerButton}
                  onClick={handleTrailerClick}
                  disabled={!trailerKey}
                >
                  <FaYoutube /> {trailerKey ? 'Watch Trailer' : 'No Trailer'}
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

            {!isPlaying ? (
              <div className={styles.playerContainer} style={{ backgroundImage: `url(${getImageUrl(details.backdrop_path, 'original')})` }}>
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
                  allow="autoplay; fullscreen"
                  onError={() => {
                    toast.error('Failed to load video. Please try another server.');
                    setIsPlaying(false);
                  }}
                />
              </div>
            )}
          </div>

          <div className={styles.serverpara}>If the current server is not working, please try switching to other servers.</div>
          <div className={styles.serverButtons}>
            {servers.map((server) => (
              <button
                key={server.id}
                className={`${styles.serverButton} ${selectedServer === server.id ? styles.active : ''}`}
                onClick={() => setSelectedServer(server.id)}
              >
                <FaCloudBolt /> {server.name}
              </button>
            ))}
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

          {/* Season and Episode Selection for TV Series */}
          {type === 'tv' && details.seasons && (
            <div className={styles.seasonEpisodeSection}>
              <div className={styles.seasonDropdown}>
                <div
                  className={styles.seasonSelector}
                  onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                >
                  <span>Season {selectedSeason}</span>
                  <FaChevronDown className={styles.dropdownIcon} />
                </div>
                {showSeasonDropdown && (
                  <div className={styles.dropdownMenu}>
                    {details.seasons
                      .filter(season => season.season_number > 0)
                      .map((season) => (
                        <div
                          key={season.season_number}
                          className={`${styles.dropdownItem} ${selectedSeason === season.season_number ? styles.active : ''}`}
                          onClick={() => handleSeasonSelect(season.season_number)}
                        >
                          Season {season.season_number}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className={styles.episodeGrid}>
                {Array.from({ length: details.seasons.find(s => s.season_number === selectedSeason)?.episode_count || 0 }, (_, i) => i + 1).map((episodeNumber) => (
                  <div
                    key={episodeNumber}
                    className={`${styles.episodeBox} ${selectedEpisode === episodeNumber ? styles.activeEpisode : ''}`}
                    onClick={() => handleEpisodeSelect(episodeNumber)}
                  >
                    EP {episodeNumber}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Content */}
          {similarContent.length > 0 && (
            <div className={styles.similarSection}>
              <div className={styles.similarHeader}>
                <div className={styles.similarTitleBar}></div>
                <h3>You May Like</h3>
              </div>
              <MovieSection
                title=""
                items={similarContent}
                type={type}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}