// AniList GraphQL API utilities

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Main anime query
export const ANIME_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        large
        extraLarge
      }
      bannerImage
      trailer {
        id
        site
        thumbnail
      }
      episodes
      duration
      season
      seasonYear
      status
      format
      genres
      averageScore
      meanScore
      popularity
      trending
      countryOfOrigin
      studios {
        nodes {
          name
        }
      }
      staff {
        edges {
          role
          node {
            name {
              full
            }
          }
        }
      }
      nextAiringEpisode {
        episode
        airingAt
        timeUntilAiring
      }
             relations {
         edges {
           id
           relationType
           node {
             id
             title {
               romaji
               english
             }
             coverImage {
               large
             }
             type
             format
             episodes
             status
             season
             seasonYear
             averageScore
           }
         }
       }
    }
  }
`;

// Search anime query
export const SEARCH_ANIME_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(search: $search, type: ANIME, sort: [POPULARITY_DESC]) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
        }
        averageScore
        episodes
        status
        season
        seasonYear
        format
      }
    }
  }
`;

// Trending anime query
export const TRENDING_ANIME_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(type: ANIME, sort: [TRENDING_DESC]) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
        }
        averageScore
        episodes
        status
        season
        seasonYear
        format
        genres
        studios {
          nodes {
            name
          }
        }
      }
    }
  }
`;

// Popular anime query
export const POPULAR_ANIME_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(type: ANIME, sort: [POPULARITY_DESC]) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
        }
        averageScore
        episodes
        status
        season
        seasonYear
        format
        genres
        studios {
          nodes {
            name
          }
        }
      }
    }
  }
`;

// Generic function to make GraphQL requests to AniList
export async function fetchAniList(query, variables = {}) {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
    }

    return data.data;
  } catch (error) {
    console.error('AniList API error:', error);
    throw error;
  }
}

// Get anime details by ID
export async function getAnimeDetails(id) {
  const data = await fetchAniList(ANIME_QUERY, { id: parseInt(id) });
  return data?.Media;
}

// Search anime
export async function searchAnime(searchTerm, page = 1, perPage = 20) {
  const data = await fetchAniList(SEARCH_ANIME_QUERY, {
    search: searchTerm,
    page,
    perPage
  });
  return data?.Page;
}

// Get trending anime
export async function getTrendingAnime(page = 1, perPage = 20) {
  const data = await fetchAniList(TRENDING_ANIME_QUERY, {
    page,
    perPage
  });
  return data?.Page;
}

// Get popular anime
export async function getPopularAnime(page = 1, perPage = 20) {
  const data = await fetchAniList(POPULAR_ANIME_QUERY, {
    page,
    perPage
  });
  return data?.Page;
}

// Get anime genres
export async function getAnimeGenres() {
  // AniList doesn't have a dedicated genres endpoint, so we'll return common anime genres
  // These are the most popular genres from AniList
  return [
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Horror',
    'Mecha',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Sports',
    'Supernatural',
    'Thriller',
    'Psychological',
    'Historical',
    'Military',
    'Parody',
    'School',
    'Shounen',
    'Shoujo',
    'Seinen',
    'Josei',
    'Ecchi',
    'Harem',
    'Martial Arts',
    'Music',
    'Game',
    'Demons',
    'Vampire',
    'Samurai',
    'Police',
    'Super Power',
    'Magic',
    'Space',
    'Cars',
    'Racing',
    'Kids',
    'Family'
  ];
}

// Get anime studios
export async function getAnimeStudios() {
  // Return common anime studios based on AniList data
  return [
    'MAPPA',
    'Studio Ghibli',
    'Bones',
    'Toei Animation',
    'Madhouse',
    'Pierrot',
    'Studio Deen',
    'A-1 Pictures',
    'Kyoto Animation',
    'Production I.G',
    'Wit Studio',
    'Trigger',
    'Gainax',
    'Shaft',
    'Sunrise',
    'Doga Kobo',
    'White Fox',
    'P.A. Works',
    'J.C.Staff',
    'Lerche',
    'Brain\'s Base',
    'CloverWorks',
    'Ufotable',
    'Silver Link',
    'Studio Bind',
    'LIDENFILMS',
    'WIT Studio',
    'Orange',
    'Polygon Pictures'
  ];
}

// Format time until next episode
export function formatTimeUntilNext(seconds) {
  if (!seconds) return '';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Format duration
export function formatDuration(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Convert AniList anime data to MovieCard format
export function convertAnimeToMovieCard(anime) {
  // Create a proper date string for anime (just the year)
  const animeDate = anime.seasonYear ? `${anime.seasonYear}-01-01` : '';

  return {
    id: anime.id || 0,
    title: anime.title?.english || anime.title?.romaji || 'Unknown Title',
    name: anime.title?.english || anime.title?.romaji || 'Unknown Title',
    overview: anime.description || '',
    poster_path: anime.coverImage?.large || '',
    backdrop_path: anime.coverImage?.large || '',
    vote_average: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : '0.0',
    release_date: animeDate,
    first_air_date: animeDate,
    media_type: 'anime',
    mediaType: 'anime',
    episodes: anime.episodes || 0,
    status: anime.status || 'UNKNOWN',
    format: anime.format || 'TV',
    genres: anime.genres || [],
    studios: anime.studios || { nodes: [] }
  };
}
