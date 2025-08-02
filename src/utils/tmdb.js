const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Get API key from environment variables
const getApiKey = () => {
    return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
};

// Filter function to remove low-quality content
export const filterValidContent = (items) => {
    return items.filter(item => {
        // Basic info checks
        const hasTitle = item.title || item.name;
        const hasOverview = item.overview && item.overview.trim().length > 20;

        // Media assets checks
        const hasPoster = item.poster_path && item.poster_path !== '';
        const hasBackdrop = item.backdrop_path && item.backdrop_path !== '';

        // Rating and votes checks
        const hasVotes = item.vote_count && item.vote_count >= 10; // At least 10 votes
        const hasGoodRating = item.vote_average && item.vote_average >= 4.0; // Rating >= 4.0

        // Release date checks (for movies)
        const hasReleaseDate = item.release_date || item.first_air_date;

        // Media type check
        const hasMediaType = item.media_type || (item.title ? 'movie' : 'tv');

        // Additional quality checks
        const hasPopularity = item.popularity && item.popularity > 0;

        // For TV shows, check if it has episodes
        const hasEpisodes = item.media_type === 'tv' ? (item.vote_count > 0) : true;

        return (
            hasTitle &&
            hasOverview &&
            hasPoster &&
            hasBackdrop &&
            hasVotes &&
            hasGoodRating &&
            hasReleaseDate &&
            hasMediaType &&
            hasPopularity &&
            hasEpisodes
        );
    });
};

// Ensure unique keys by adding media type prefix
export const ensureUniqueKeys = (items) => {
    return items.map(item => ({
        ...item,
        uniqueKey: `${item.media_type || (item.title ? 'movie' : 'tv')}_${item.id}`
    }));
};

// Generic fetch function for TMDB API
const tmdbFetch = async (endpoint, params = {}) => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('TMDB API key not found');
    }

    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', apiKey);

    Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
    });

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
    }

    return response.json();
};

// Get image URL
export const getImageUrl = (path, size = 'w500') => {
    if (!path) return '/placeholder-movie.jpg';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Fetch trending content for the week (both movies and series)
export const getTrending = async (mediaType = 'all', timeWindow = 'week') => {
    const data = await tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
    const filteredData = filterValidContent(data.results);
    return ensureUniqueKeys(filteredData);
};

// Fetch popular movies of all time (using top rated instead of popular)
export const getPopularMovies = async (page = 1) => {
    const data = await tmdbFetch('/movie/top_rated', { page });
    const filteredData = filterValidContent(data.results);
    return {
        results: ensureUniqueKeys(filteredData),
        totalPages: data.total_pages,
        page: data.page
    };
};

// Fetch popular TV shows
export const getPopularTVShows = async (page = 1) => {
    const data = await tmdbFetch('/tv/top_rated', { page });
    const filteredData = filterValidContent(data.results);
    return {
        results: ensureUniqueKeys(filteredData),
        totalPages: data.total_pages,
        page: data.page
    };
};

// Fetch top rated movies
export const getTopRatedMovies = async (page = 1) => {
    const data = await tmdbFetch('/movie/top_rated', { page });
    const filteredData = filterValidContent(data.results);
    return {
        results: ensureUniqueKeys(filteredData),
        totalPages: data.total_pages,
        page: data.page
    };
};

// Fetch movie details
export const getMovieDetails = async (movieId) => {
    return await tmdbFetch(`/movie/${movieId}`, { append_to_response: 'credits,videos,similar' });
};

// Fetch TV show details
export const getTVShowDetails = async (tvId) => {
    return await tmdbFetch(`/tv/${tvId}`, { append_to_response: 'credits,videos,similar' });
};

// Search movies and TV shows
export const searchMulti = async (query, page = 1) => {
    const data = await tmdbFetch('/search/multi', { query, page });
    const filteredData = filterValidContent(data.results);
    return {
        results: ensureUniqueKeys(filteredData),
        totalPages: data.total_pages,
        page: data.page
    };
};

// Get movies by genre
export const getMoviesByGenre = async (genreId, page = 1) => {
    const data = await tmdbFetch('/discover/movie', {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc'
    });
    const filteredData = filterValidContent(data.results);
    return {
        results: ensureUniqueKeys(filteredData),
        totalPages: data.total_pages,
        page: data.page
    };
};

// Get TV shows by genre
export const getTVShowsByGenre = async (genreId, page = 1) => {
    const data = await tmdbFetch('/discover/tv', {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc'
    });
    const filteredData = filterValidContent(data.results);
    return {
        results: ensureUniqueKeys(filteredData),
        totalPages: data.total_pages,
        page: data.page
    };
};

// Get movie genres
export const getMovieGenres = async () => {
    const data = await tmdbFetch('/genre/movie/list');
    return data.genres;
};

// Get TV genres
export const getTVGenres = async () => {
    const data = await tmdbFetch('/genre/tv/list');
    return data.genres;
};

// Get now playing movies
export const getNowPlayingMovies = async (page = 1) => {
    const data = await tmdbFetch('/movie/now_playing', { page });
    const filteredData = filterValidContent(data.results);
    return {
        results: ensureUniqueKeys(filteredData),
        totalPages: data.total_pages,
        page: data.page
    };
};

// Get upcoming movies
export const getUpcomingMovies = async (page = 1) => {
    const data = await tmdbFetch('/movie/upcoming', { page });
    const filteredData = filterValidContent(data.results);
    return {
        results: ensureUniqueKeys(filteredData),
        totalPages: data.total_pages,
        page: data.page
    };
};

// Get TV show season details
export const getTVSeasonDetails = async (tvId, seasonNumber) => {
    return await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
};

export default {
    getTrending,
    getPopularMovies,
    getPopularTVShows,
    getTopRatedMovies,
    getMovieDetails,
    getTVShowDetails,
    searchMulti,
    getMoviesByGenre,
    getTVShowsByGenre,
    getMovieGenres,
    getTVGenres,
    getNowPlayingMovies,
    getUpcomingMovies,
    getTVSeasonDetails,
    getImageUrl,
    filterValidContent,
    ensureUniqueKeys
}; 