import { getAnimeDetails } from '@/utils/anilist';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const actualId = id ? id.split('-')[0] : null;

    if (!actualId) {
        return {
            title: 'Anime Not Found | AKMovies',
            description: 'The requested anime could not be found.'
        };
    }

    try {
        const details = await getAnimeDetails(actualId);

        if (!details) {
            return {
                title: 'Anime Not Found | AKMovies',
                description: 'The requested anime could not be found.'
            };
        }

        const title = details.title?.english || details.title?.romaji || details.title?.native || 'Anime';
        const rawDescription = details.description || `Watch ${title} online for free on AKMovies.`;
        const description = rawDescription
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const posterUrl = details.coverImage?.large || details.coverImage?.extraLarge || '/anime_placeholder.jpg';
        const backdropUrl = details.bannerImage || details.coverImage?.extraLarge || posterUrl;
        const year = details.seasonYear || '';
        const rating = details.averageScore ? (details.averageScore / 10).toFixed(1) : '';
        const genres = Array.isArray(details.genres) ? details.genres.join(', ') : '';
        const studio = details.studios?.nodes?.[0]?.name || '';

        const fullTitle = `${title}${year ? ` (${year})` : ''} | Watch Online Free | AKMovies`;
        const fullDescription = `${description} ${year ? `Released in ${year}.` : ''} ${rating ? `Rating: ${rating}/10.` : ''} ${genres ? `Genres: ${genres}.` : ''}`.trim();

        const canonical = `https://realakmovies.vercel.app/anime/${id}`;

        return {
            title: fullTitle,
            description: fullDescription,
            keywords: [
                title,
                'anime',
                'watch online',
                'free streaming',
                'HD quality',
                'AKMovies',
                year,
                studio,
                genres
            ].filter(Boolean).join(', '),
            openGraph: {
                title: fullTitle,
                description: fullDescription,
                type: 'video.other',
                url: canonical,
                siteName: 'AKMovies',
                images: [
                    {
                        url: posterUrl,
                        width: 500,
                        height: 750,
                        alt: `${title} Poster`,
                        type: 'image/jpeg'
                    },
                    {
                        url: backdropUrl,
                        width: 1920,
                        height: 1080,
                        alt: `${title} Banner`,
                        type: 'image/jpeg'
                    }
                ],
                locale: 'en_US'
            },
            twitter: {
                card: 'summary_large_image',
                title: fullTitle,
                description: fullDescription,
                images: [posterUrl],
                creator: '@ankitkaushik',
                site: '@akmovies'
            },
            alternates: {
                canonical
            }
        };
    } catch (error) {
        console.error('Error generating anime metadata:', error);
        return {
            title: 'Error Loading Anime | AKMovies',
            description: 'There was an error loading the requested anime.'
        };
    }
}

export default function AnimeLayout({ children }) {
    return children;
}


