'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { getImageUrl } from '@/utils/tmdb';
import styles from './index.module.css';

const HeroSlider = ({ movies = [] }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            dragFree: false,
            duration: 40
        },
        [Autoplay({ delay: 4000, stopOnInteraction: false })]
    );

    const [selectedIndex, setSelectedIndex] = useState(0);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
    }, [emblaApi, onSelect]);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const formatDuration = (minutes) => {
        if (!minutes) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatTitle = (title) => {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    };

    const getWatchUrl = (item) => {
        const title = item.title || item.name;
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
        const formattedTitle = formatTitle(title);
        return `/watch/${mediaType}/${item.id}-${formattedTitle}`;
    };

    const getReleaseYear = (item) => {
        const date = item.release_date || item.first_air_date;
        return date ? new Date(date).getFullYear() : '';
    };

    const getGenres = (item) => {
        // For trending items, we might have genre_ids or genres array
        if (item.genre_ids) {
            return item.genre_ids.slice(0, 3);
        }
        if (item.genres && Array.isArray(item.genres)) {
            return item.genres.slice(0, 3).map(genre => genre.id);
        }
        return [];
    };

    const genreNames = {
        // Movie Genres
        28: 'Action',
        12: 'Adventure',
        16: 'Animation',
        35: 'Comedy',
        80: 'Crime',
        99: 'Documentary',
        18: 'Drama',
        10751: 'Family',
        14: 'Fantasy',
        36: 'History',
        27: 'Horror',
        10402: 'Music',
        9648: 'Mystery',
        10749: 'Romance',
        878: 'Sci-Fi',
        10770: 'TV Movie',
        53: 'Thriller',
        10752: 'War',
        37: 'Western',

        // TV Genres
        10759: 'Action & Adventure',
        10762: 'Kids',
        10763: 'News',
        10764: 'Reality',
        10765: 'Sci-Fi & Fantasy',
        10766: 'Soap',
        10767: 'Talk',
        10768: 'War & Politics',

        // Additional Genres
        10769: 'Foreign',
        10463: 'Sport'
    };

    const getGenreName = (genreId) => {
        return genreNames[genreId] || 'Other';
    };

    if (!movies || movies.length === 0) {
        return <div className={styles.loading}>Loading hero content...</div>;
    }

    return (
        <div className={styles.heroContainer}>
            <div className={styles.embla} ref={emblaRef}>
                <div className={styles.emblaContainer}>
                    {movies.map((item, index) => {
                        const title = item.title || item.name;
                        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

                        return (
                            <div key={item.id} className={styles.emblaSlide}>
                                <div
                                    className={styles.slideBackground}
                                    style={{
                                        backgroundImage: `url(${getImageUrl(item.backdrop_path, 'original')})`
                                    }}
                                >
                                    <div className={styles.slideOverlay} />
                                    <div className={styles.slideTopOverlay} />
                                    <div className={styles.slideLeftOverlay} />

                                    <div className={styles.slideContent}>
                                        <div className={styles.contentWrapper}>
                                            <h1 className={styles.title}>{title}</h1>

                                            <div className={styles.metaInfo}>
                                                <div className={styles.metaRow}>
                                                    {getGenres(item).map((genreId, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={`/browse?genre=${genreId}&type=${mediaType}`}
                                                            className={styles.genreTag}
                                                        >
                                                            {getGenreName(genreId)}
                                                        </a>
                                                    ))}
                                                </div>

                                                <div className={styles.metaRow}>
                                                    {getReleaseYear(item) && (
                                                        <span className={styles.metaItem}>{getReleaseYear(item)}</span>
                                                    )}

                                                    {(item.runtime || item.episode_run_time?.[0]) && (
                                                        <span className={styles.metaItem}>
                                                            {formatDuration(item.runtime || item.episode_run_time?.[0])}
                                                        </span>
                                                    )}

                                                    {item.vote_average > 0 && (
                                                        <span className={styles.ratingItem}>
                                                            <span className={styles.star}>★</span>
                                                            {item.vote_average.toFixed(1)}
                                                        </span>
                                                    )}

                                                    <span className={styles.ageRating}>PG-13</span>

                                                    <span className={styles.mediaType}>
                                                        {mediaType.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className={styles.description}>
                                                {item.overview && item.overview.length > 200
                                                    ? `${item.overview.substring(0, 200)}...`
                                                    : item.overview
                                                }
                                            </p>

                                            <a href={getWatchUrl(item)} className={styles.watchButton}>
                                                <span className={styles.playIcon}>▶</span>
                                                Watch Now
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Navigation Arrows */}
            <button
                className={`${styles.navButton} ${styles.prevButton}`}
                onClick={scrollPrev}
                aria-label="Previous slide"
            >
                ‹
            </button>

            <button
                className={`${styles.navButton} ${styles.nextButton}`}
                onClick={scrollNext}
                aria-label="Next slide"
            >
                ›
            </button>

            {/* Dots Indicator */}
            <div className={styles.dotsContainer}>
                {movies.map((_, index) => (
                    <button
                        key={index}
                        className={`${styles.dot} ${selectedIndex === index ? styles.activeDot : ''}`}
                        onClick={() => emblaApi && emblaApi.scrollTo(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;