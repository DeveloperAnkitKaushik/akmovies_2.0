const VIDSRC_BASE_URL = 'https://vidsrc.cc';

// Generate movie embed URL
export const getMovieEmbedUrl = (tmdbId, options = {}) => {
    const { version = 'v2', poster = true, autoPlay = false } = options;

    let url = `${VIDSRC_BASE_URL}/${version}/embed/movie/${tmdbId}`;

    const params = new URLSearchParams();
    if (!poster) params.append('poster', 'false');
    if (autoPlay) params.append('autoPlay', 'true');

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
};

// Generate TV show embed URL (entire series)
export const getTVShowEmbedUrl = (tmdbId, options = {}) => {
    const { version = 'v2', poster = true, autoPlay = false } = options;

    let url = `${VIDSRC_BASE_URL}/${version}/embed/tv/${tmdbId}`;

    const params = new URLSearchParams();
    if (!poster) params.append('poster', 'false');
    if (autoPlay) params.append('autoPlay', 'true');

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
};

// Generate TV show season embed URL
export const getTVSeasonEmbedUrl = (tmdbId, seasonNumber, options = {}) => {
    const { version = 'v2', poster = true, autoPlay = false } = options;

    let url = `${VIDSRC_BASE_URL}/${version}/embed/tv/${tmdbId}/${seasonNumber}`;

    const params = new URLSearchParams();
    if (!poster) params.append('poster', 'false');
    if (autoPlay) params.append('autoPlay', 'true');

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
};

// Generate TV show episode embed URL
export const getTVEpisodeEmbedUrl = (tmdbId, seasonNumber, episodeNumber, options = {}) => {
    const { version = 'v2', poster = true, autoPlay = false } = options;

    let url = `${VIDSRC_BASE_URL}/${version}/embed/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`;

    const params = new URLSearchParams();
    if (!poster) params.append('poster', 'false');
    if (autoPlay) params.append('autoPlay', 'true');

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
};

// Get appropriate embed URL based on media type and details
export const getEmbedUrl = (mediaType, tmdbId, seasonNumber = null, episodeNumber = null, options = {}) => {
    if (mediaType === 'movie') {
        return getMovieEmbedUrl(tmdbId, options);
    } else if (mediaType === 'tv') {
        if (episodeNumber && seasonNumber) {
            return getTVEpisodeEmbedUrl(tmdbId, seasonNumber, episodeNumber, options);
        } else if (seasonNumber) {
            return getTVSeasonEmbedUrl(tmdbId, seasonNumber, options);
        } else {
            return getTVShowEmbedUrl(tmdbId, options);
        }
    }
    throw new Error('Invalid media type. Must be "movie" or "tv"');
};

// Player event handler setup (for tracking user interactions)
export const setupPlayerEvents = (iframe) => {
    if (!iframe) return;

    // Listen for player events from the iframe
    const handlePlayerEvent = (event) => {
        // Ensure the event is from vidsrc domain
        if (event.origin !== 'https://vidsrc.cc') return;

        if (event.data && event.data.type === 'PLAYER_EVENT') {
            const { eventType, currentTime, duration, tmdbId, season, episode, mediaType } = event.data.data;

            // Handle different player events
            switch (eventType) {
                case 'play':
                    console.log('Player started playing', { tmdbId, currentTime });
                    // You can save this to Firebase for continue watching
                    break;
                case 'pause':
                    console.log('Player paused', { tmdbId, currentTime });
                    break;
                case 'time':
                    console.log('Time update', { tmdbId, currentTime, duration });
                    // Update progress in Firebase
                    break;
                case 'complete':
                    console.log('Video completed', { tmdbId });
                    // Mark as watched in Firebase
                    break;
                default:
                    console.log('Unknown player event:', eventType);
            }
        }
    };

    // Add event listener
    window.addEventListener('message', handlePlayerEvent);

    // Return cleanup function
    return () => {
        window.removeEventListener('message', handlePlayerEvent);
    };
};

// Helper function to extract TMDB ID from various sources
export const extractTmdbId = (id) => {
    // If it's already a number or string number, return it
    if (typeof id === 'number' || !isNaN(id)) {
        return id.toString();
    }

    // If it has 'tt' prefix (IMDB ID), you might need to convert it
    // For now, just return as is since Vidsrc accepts TMDB IDs
    return id.toString();
};

export default {
    getMovieEmbedUrl,
    getTVShowEmbedUrl,
    getTVSeasonEmbedUrl,
    getTVEpisodeEmbedUrl,
    getEmbedUrl,
    setupPlayerEvents,
    extractTmdbId
}; 