import React from 'react';
import { IoPlayCircle } from "react-icons/io5";
import styles from './index.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className="main-container">
        {/* Red horizontal line with play button */}
        <div className={styles.lineContainer}>
          {/* Left fading line */}
          <div className={styles.leftLine}></div>

          {/* Center play button */}
          <div className={styles.playButton}>
            <img src="/logo.png" alt="" />
          </div>

          {/* Right fading line */}
          <div className={styles.rightLine}></div>
        </div>

        {/* Main description */}
        <div className={styles.description}>
          Developed with 💖 by Ankit Kaushik
        </div>

        {/* Footer links and copyright */}
        <div className={styles.footerContent}>
          {/* Copyright */}
          <div className={styles.copyright}>
            © 2025 AKMovies
          </div>

          {/* Disclaimer */}
          <div className={styles.disclaimer}>
            This site does not store any files on our server, we only linked to the media which is hosted on 3rd party services.
          </div>

          {/* Links */}
          <div className={styles.links}>
              <div className={styles.link}>Request</div>
              <div className={styles.link}>Contact</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;