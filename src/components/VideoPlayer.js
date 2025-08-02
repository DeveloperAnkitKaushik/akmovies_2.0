'use client';

import { useEffect, useRef } from 'react';
import { getEmbedUrl, setupPlayerEvents } from '@/utils/vidsrc';
import styles from './VideoPlayer.module.css';

const VideoPlayer = ({
    mediaType,
    tmdbId,
    seasonNumber = null,
    episodeNumber = null,
    className = ""
}) => {
    const iframeRef = useRef(null);

    useEffect(() => {
        // Setup player event listeners
        const cleanup = setupPlayerEvents(iframeRef.current);

        return () => {
            if (cleanup) cleanup();
        };
    }, [tmdbId, seasonNumber, episodeNumber]);

    const embedUrl = getEmbedUrl(mediaType, tmdbId, seasonNumber, episodeNumber, {
        version: 'v2',
        poster: true,
        autoPlay: false
    });

    return (
        <div className={`${styles.container} ${className}`}>
            <div className={styles.videoWrapper}>
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    className={styles.videoFrame}
                    allowFullScreen
                    frameBorder="0"
                    scrolling="no"
                    title={`${mediaType} player`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            </div>

            {/* Loading overlay */}
            <div className={styles.loadingOverlay}>
                <div className={styles.loadingContent}>
                    <div className={styles.loadingIcon}>
                        <svg className={styles.playIcon} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 5v10l7-5z" />
                        </svg>
                    </div>
                    <p className={styles.loadingText}>Loading player...</p>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;