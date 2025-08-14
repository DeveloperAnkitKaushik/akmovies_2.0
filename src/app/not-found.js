import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
    return (
        <div className={styles.container}>
            <div className={styles.art} aria-hidden="true">
                <div className={styles.ghost}>
                    <div className={styles.face}>
                        <span className={styles.eye}></span>
                        <span className={styles.eye}></span>
                        <span className={styles.mouth}></span>
                    </div>
                </div>
                <div className={styles.shadow}></div>
            </div>

            <h1 className={styles.title}>404</h1>
            <p className={styles.subtitle}>Page not found</p>
            <p className={styles.description}>
                The page you’re looking for doesn’t exist or may have moved.
            </p>

            <div className={styles.actions}>
                <Link href="/" className={styles.primary}>Go Home</Link>
                <Link href="/browse" className={styles.secondary}>Browse</Link>
            </div>
        </div>
    );
}


