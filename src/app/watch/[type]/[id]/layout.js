import { getMovieDetails, getTVShowDetails, getImageUrl } from '@/utils/tmdb';

export async function generateMetadata({ params }) {
    const { type, id } = await params;
    const actualId = id ? id.split('-')[0] : null;

    if (!actualId) {
        return {
            title: 'Movie/Series Not Found | AKMovies',
            description: 'The requested movie or TV series could not be found.',
        };
    }

    try {
        let details;
        if (type === 'movie') {
            details = await getMovieDetails(actualId);
        } else if (type === 'tv') {
            details = await getTVShowDetails(actualId);
        } else {
            return {
                title: 'Invalid Content Type | AKMovies',
                description: 'The requested content type is not valid.',
            };
        }

        if (!details) {
            return {
                title: 'Content Not Found | AKMovies',
                description: 'The requested content could not be found.',
            };
        }

        const title = details.title || details.name;
        const description = details.overview || `Watch ${title} online for free on AKMovies.`;
        const posterUrl = getImageUrl(details.poster_path, 'w500');
        const backdropUrl = getImageUrl(details.backdrop_path, 'original');
        const year = details.release_date ? new Date(details.release_date).getFullYear() :
            details.first_air_date ? new Date(details.first_air_date).getFullYear() : '';
        const runtime = details.runtime || details.episode_run_time?.[0] || '';
        const rating = details.vote_average ? details.vote_average.toFixed(1) : '';
        const genres = details.genres ? details.genres.map(g => g.name).join(', ') : '';

        const fullTitle = `${title} (${year}) | Watch Online Free | AKMovies`;
        const fullDescription = `${description} ${year ? `Released in ${year}.` : ''} ${rating ? `Rating: ${rating}/10.` : ''} ${genres ? `Genres: ${genres}.` : ''} Watch ${title} online for free on AKMovies.`;

        return {
            title: fullTitle,
            description: fullDescription,
            keywords: [
                title,
                'watch online',
                'free streaming',
                'HD quality',
                'AKMovies',
                type === 'movie' ? 'movie' : 'TV series',
                year,
                genres
            ].filter(Boolean).join(', '),
            openGraph: {
                title: fullTitle,
                description: fullDescription,
                type: 'video.movie',
                url: `https://realakmovies.vercel.app/watch/${type}/${id}`,
                siteName: 'AKMovies',
                images: [
                    {
                        url: posterUrl,
                        width: 500,
                        height: 750,
                        alt: `${title} Poster`,
                        type: 'image/jpeg',
                    },
                    {
                        url: backdropUrl,
                        width: 1920,
                        height: 1080,
                        alt: `${title} Backdrop`,
                        type: 'image/jpeg',
                    }
                ],
                locale: 'en_US',
            },
            twitter: {
                card: 'summary_large_image',
                title: fullTitle,
                description: fullDescription,
                images: [posterUrl],
                creator: '@ankitkaushik',
                site: '@akmovies',
            },
            alternates: {
                canonical: `https://realakmovies.vercel.app/watch/${type}/${id}`,
            },
            other: {
                'og:video': `https://realakmovies.vercel.app/watch/${type}/${id}`,
                'og:video:type': 'text/html',
                'og:video:width': '1920',
                'og:video:height': '1080',
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Error Loading Content | AKMovies',
            description: 'There was an error loading the requested content.',
        };
    }
}

export default function WatchLayout({ children }) {
    return children;
} 