import styles from './page.module.css';

export default function Loading() {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.loadingContent}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Loading anime details...</p>
            </div>
        </div>
    );
}
