'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import MovieCard from '@/components/MovieCard';
import styles from './index.module.css';

const MovieSection = ({ title, items, isLarge = false, type = 'normal', onRemove }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        dragFree: true,
        containScroll: 'trimSnaps',
        slidesToScroll: 1
    });

    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
            emblaApi.off('reInit', onSelect);
        };
    }, [emblaApi, onSelect]);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>
                {title}
            </h2>
            <div className={styles.container}>
                <div className={styles.embla} ref={emblaRef}>
                    <div className={styles.emblaContainer}>
                        {items.map((item) => (
                            <div key={item.uniqueKey || item.id} className={styles.emblaSlide}>
                                <MovieCard
                                    item={item}
                                    isLarge={isLarge}
                                    type={type}
                                    onRemove={onRemove}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Buttons */}
                {canScrollPrev && (
                    <button
                        className={`${styles.navButton} ${styles.prevButton}`}
                        onClick={scrollPrev}
                        aria-label="Previous"
                    >
                        ‹
                    </button>
                )}

                {canScrollNext && (
                    <button
                        className={`${styles.navButton} ${styles.nextButton}`}
                        onClick={scrollNext}
                        aria-label="Next"
                    >
                        ›
                    </button>
                )}
            </div>
        </section>
    );
};

export default MovieSection; 