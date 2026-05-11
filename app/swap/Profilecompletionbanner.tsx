"use client";

// components/home/ProfileCompletionBanner.tsx
import React from "react";
import styles from "./Profilecompletionbanner.module.css";

interface ProfileCompletionBannerProps {
  progress?: number; // 0–100
  onComplete?: () => void;
}

export default function ProfileCompletionBanner({
  progress = 40,
  onComplete,
}: ProfileCompletionBannerProps) {
  return (
    <div className={styles.banner}>

      {/* Top row: icon + text + button */}
      <div className={styles.bannerTop}>
        <div className={styles.icon}>⚡</div>

        <div className={styles.content}>
          <p className={styles.title}>
            Complete your profile — get 3× more matches
          </p>
          <p className={styles.subtitle}>
            Add a profile photo and verify your phone to unlock better visibility
          </p>
        </div>

        <button className={styles.cta} onClick={onComplete}>
          Complete now
        </button>
      </div>

      {/* Progress bar — sits below the row, margin keeps it off card edges */}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

    </div>
  );
}