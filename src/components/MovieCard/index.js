import Image from 'next/image';
import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';
import { getImageUrl } from '@/utils/tmdb';
import styles from './index.module.css';

const MovieCard = ({ item, isLarge = false, type = 'normal', onRemove }) => {
    // Handle different data structures
    const isContinueWatching = type === 'continue';

    // For continue watching items, use the stored data structure
    const title = isContinueWatching ? item.title : (item.title || item.name);
    const releaseDate = isContinueWatching ? null : (item.release_date || item.first_air_date);
    const mediaType = isContinueWatching ? item.mediaType : (item.media_type || (item.title ? 'movie' : 'tv'));
    const posterPath = isContinueWatching ? item.posterPath : item.poster_path;
    const voteAverage = isContinueWatching ? null : item.vote_average;
    const itemId = isContinueWatching ? item.id : item.id;

    const formatTitle = (title) => {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    };

    const getWatchUrl = (item) => {
        const title = isContinueWatching ? item.title : (item.title || item.name);
        const mediaType = isContinueWatching ? item.mediaType : (item.media_type || (item.title ? 'movie' : 'tv'));
        const formattedTitle = formatTitle(title);
        return `/watch/${mediaType}/${itemId}-${formattedTitle}`;
    };

    const handleRemove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onRemove) {
            onRemove(item);
        }
    };

    const cardClass = isLarge ? styles.largeCard : styles.smallCard;

    return (
        <Link href={getWatchUrl(item)}>
            <div className={`${styles.card} ${cardClass}`}>
                <div className={styles.imageContainer}>
                    {/* Remove button for continue watching items */}
                    {isContinueWatching && onRemove && (
                        <button
                            className={styles.removeButton}
                            onClick={handleRemove}
                            title="Remove from continue watching"
                        >
                            <FaTimes />
                        </button>
                    )}

                    {/* Poster Image */}
                    <Image
                        src={getImageUrl(posterPath, 'w500')}
                        alt={title}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 144px, 176px"
                    />

                    {/* Overlay with gradient */}
                    <div className={styles.overlay} />

                    {/* Content overlay */}
                    <div className={styles.content}>
                        <div className={styles.metaInfo}>
                            <span className={styles.mediaType}>
                                {mediaType}
                            </span>
                            {releaseDate && (
                                <span className={styles.year}>
                                    {new Date(releaseDate).getFullYear()}
                                </span>
                            )}
                            {/* Show episode info for continue watching TV shows */}
                            {isContinueWatching && mediaType === 'tv' && item.episode && (
                                <span className={styles.episode}>
                                    S{item.season} E{item.episode}
                                </span>
                            )}
                        </div>

                        {/* Rating - Only show for normal items, not continue watching */}
                        {!isContinueWatching && voteAverage > 0 && (
                            <div className={styles.rating}>
                                <svg className={styles.starIcon} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className={styles.ratingText}>
                                    {voteAverage.toFixed(1)}
                                </span>
                            </div>
                        )}

                        {/* Continue watching indicator */}
                        {isContinueWatching && (
                            <div className={styles.continueIndicator}>
                                <div className={styles.continueDot}></div>
                                <span className={styles.continueText}>Continue</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default MovieCard; 