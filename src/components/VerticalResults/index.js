'use client';

import { useState, useEffect } from 'react';
import MovieCard from '@/components/MovieCard';
import styles from './index.module.css';

const VerticalResults = ({
    title,
    items = [],
    loading = false,
    hasMore = false,
    onLoadMore,
    emptyMessage = "No items found",
    showLoadMore = true,
    gridCols = 6,
    type = 'normal'
}) => {
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const handleLoadMore = async () => {
        if (onLoadMore && !isLoadingMore) {
            setIsLoadingMore(true);
            try {
                await onLoadMore();
            } finally {
                setIsLoadingMore(false);
            }
        }
    };

    const getGridClass = () => {
        const gridClasses = {
            2: styles.grid2,
            3: styles.grid3,
            4: styles.grid4,
            5: styles.grid5,
            6: styles.grid6
        };
        return gridClasses[gridCols] || styles.grid6;
    };

    if (loading && items.length === 0) {
        return (
            <div className={styles.container}>
                {title && <h2 className={styles.title}>{title}</h2>}
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p className={styles.loadingText}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!loading && items.length === 0) {
        return (
            <div className={styles.container}>
                {title && <h2 className={styles.title}>{title}</h2>}
                <div className={styles.emptyContainer}>
                    <div className={styles.emptyIcon}>📺</div>
                    <p className={styles.emptyText}>{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {title && <h2 className={styles.title}>{title}</h2>}

            <div className={`${styles.resultsGrid} ${getGridClass()}`}>
                {items.map((item) => (
                    <div key={item.uniqueKey || item.id} className={styles.resultItem}>
                        <MovieCard item={item} type={type} />
                    </div>
                ))}
            </div>

            {showLoadMore && hasMore && (
                <div className={styles.loadMoreContainer}>
                    <button
                        className={styles.loadMoreButton}
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                    >
                        {isLoadingMore ? (
                            <>
                                <div className={styles.buttonSpinner}></div>
                                <span>Loading...</span>
                            </>
                        ) : (
                            <span>Load More</span>
                        )}
                    </button>
                </div>
            )}

            {loading && items.length > 0 && (
                <div className={styles.loadingMoreContainer}>
                    <div className={styles.loadingMoreSpinner}></div>
                    <span>Loading more...</span>
                </div>
            )}
        </div>
    );
};

export default VerticalResults; 