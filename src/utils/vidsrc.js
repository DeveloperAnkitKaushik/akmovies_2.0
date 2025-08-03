// Multiple Vidsrc domains for fallback
const VIDSRC_DOMAINS = [
    'https://vidsrc.cc',
    'https://vidsrc.to',
    'https://vidsrc.me',
    'https://vidsrc.xyz'
];

// Generate movie embed URL with fallback support
export const getMovieEmbedUrl = (tmdbId, options = {}) => {
    const { version = 'v2', poster = true, autoPlay = false, domainIndex = 0 } = options;
    const baseUrl = VIDSRC_DOMAINS[domainIndex] || VIDSRC_DOMAINS[0];

    let url = `${baseUrl}/${version}/embed/movie/${tmdbId}`;

    const params = new URLSearchParams();
    if (!poster) params.append('poster', 'false');
    if (autoPlay) params.append('autoPlay', 'true');

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
};

// Generate TV show embed URL (entire series) with fallback support
export const getTVShowEmbedUrl = (tmdbId, options = {}) => {
    const { version = 'v2', poster = true, autoPlay = false, domainIndex = 0 } = options;
    const baseUrl = VIDSRC_DOMAINS[domainIndex] || VIDSRC_DOMAINS[0];

    let url = `${baseUrl}/${version}/embed/tv/${tmdbId}`;

    const params = new URLSearchParams();
    if (!poster) params.append('poster', 'false');
    if (autoPlay) params.append('autoPlay', 'true');

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
};

// Generate TV show season embed URL with fallback support
export const getTVSeasonEmbedUrl = (tmdbId, seasonNumber, options = {}) => {
    const { version = 'v2', poster = true, autoPlay = false, domainIndex = 0 } = options;
    const baseUrl = VIDSRC_DOMAINS[domainIndex] || VIDSRC_DOMAINS[0];

    let url = `${baseUrl}/${version}/embed/tv/${tmdbId}/${seasonNumber}`;

    const params = new URLSearchParams();
    if (!poster) params.append('poster', 'false');
    if (autoPlay) params.append('autoPlay', 'true');

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
};

// Generate TV show episode embed URL with fallback support
export const getTVEpisodeEmbedUrl = (tmdbId, seasonNumber, episodeNumber, options = {}) => {
    const { version = 'v2', poster = true, autoPlay = false, domainIndex = 0 } = options;
    const baseUrl = VIDSRC_DOMAINS[domainIndex] || VIDSRC_DOMAINS[0];

    let url = `${baseUrl}/${version}/embed/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`;

    const params = new URLSearchParams();
    if (!poster) params.append('poster', 'false');
    if (autoPlay) params.append('autoPlay', 'true');

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
};

// Get appropriate embed URL based on media type and details with fallback support
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

// Test if a URL is accessible (for fallback logic)
export const testUrlAccessibility = async (url) => {
    try {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        return true;
    } catch (error) {
        return false;
    }
};

// Get fallback URL if primary fails
export const getFallbackUrl = (mediaType, tmdbId, seasonNumber = null, episodeNumber = null, options = {}) => {
    for (let i = 1; i < VIDSRC_DOMAINS.length; i++) {
        const fallbackOptions = { ...options, domainIndex: i };
        const url = getEmbedUrl(mediaType, tmdbId, seasonNumber, episodeNumber, fallbackOptions);
        return url;
    }
    return null;
};

// Player event handler setup (for tracking user interactions)
export const setupPlayerEvents = (iframe) => {
    if (!iframe) return;

    // Listen for player events from the iframe
    const handlePlayerEvent = (event) => {
        // Ensure the event is from vidsrc domain
        const vidsrcDomains = VIDSRC_DOMAINS.map(domain => new URL(domain).origin);
        if (!vidsrcDomains.includes(event.origin)) return;

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
                case 'error':
                    console.error('Player error:', event.data.data);
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

// Validate TMDB ID format
export const validateTmdbId = (id) => {
    const numId = parseInt(id);
    return !isNaN(numId) && numId > 0;
};

export default {
    getMovieEmbedUrl,
    getTVShowEmbedUrl,
    getTVSeasonEmbedUrl,
    getTVEpisodeEmbedUrl,
    getEmbedUrl,
    getFallbackUrl,
    testUrlAccessibility,
    setupPlayerEvents,
    extractTmdbId,
    validateTmdbId,
    VIDSRC_DOMAINS
}; 