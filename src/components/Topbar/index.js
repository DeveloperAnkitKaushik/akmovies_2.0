import React from 'react'
import styles from './index.module.css';

export default function Topbar({ name }) {
    return (
        <div className={styles.bg} style={{ backgroundImage: `url(/bg.jpg)` }} >
            <h1 className={styles.title}>{name}</h1>
            <div className={styles.bgoverlay}></div>
        </div>
    )
}
