"use client";
import styles from "./ExchangeCard.module.css";

const CameraIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const HeadphoneIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const SwapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function ExchangeCard() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} />
            Match Found!
          </span>
          <p className={styles.subtitle}>Great match for you</p>
        </div>

        <div className={styles.row}>
          <div className={styles.item}>
            <span className={styles.itemLabel}>Your Item</span>
            <div className={`${styles.itemIcon} ${styles.itemIconGive}`}>
              <CameraIcon />
            </div>
            <span className={styles.itemName}>Canon EOS 200D</span>
            <span className={`${styles.tag} ${styles.tagGive}`}>Good Condition</span>
          </div>

          <div className={styles.swapCol}>
            <span className={styles.swapCircle}>
              <SwapIcon />
            </span>
          </div>

          <div className={styles.item}>
            <span className={styles.itemLabel}>You Get</span>
            <div className={`${styles.itemIcon} ${styles.itemIconGet}`}>
              <HeadphoneIcon />
            </div>
            <span className={styles.itemName}>Sony WH-CH720N</span>
            <span className={`${styles.tag} ${styles.tagGet}`}>Like New</span>
          </div>
        </div>

        <button className={styles.ctaBtn} type="button">
          <SwapIcon />
          Start Exchange
        </button>

        <div className={styles.footer}>
          <div className={styles.avatars}>
            <span className={styles.avatar} style={{ background: "#93c5fd" }} />
            <span className={styles.avatar} style={{ background: "#a5b4fc" }} />
            <span className={styles.avatar} style={{ background: "#f9a8d4" }} />
          </div>
          <span className={styles.footerText}>24K+ successful exchanges</span>
        </div>
      </div>

      {/* Floating context cards for depth, matching reference design */}
      <div className={`${styles.ghostCard} ${styles.ghostLeft}`} aria-hidden="true">
        <span className={styles.ghostTitle}>Explore</span>
        <span className={styles.ghostLine} />
        <span className={styles.ghostLineShort} />
      </div>
      <div className={`${styles.ghostCard} ${styles.ghostRight}`} aria-hidden="true">
        <span className={styles.ghostTitle}>Messages</span>
        <span className={styles.ghostLine} />
        <span className={styles.ghostLineShort} />
      </div>
    </div>
  );
}
