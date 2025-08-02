import styles from './loading.module.css';

export default function loading () {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.loadingContent}>
                <div className={styles.loadingSpinner}></div>
                <p className={styles.loadingText}>Loading movies...</p>
            </div>
        </div>
    )
}
