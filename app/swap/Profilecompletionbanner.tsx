"use client";

import React, { useState } from "react";
import styles from "./Profilecompletionbanner.module.css";
import ProfileCompleteModal from "../../components/ProfileCompleteModal/ProfileCompleteModal";

interface ProfileCompletionBannerProps {
  progress?: number;
  incompleteFields?: string[];
  onProfileSaved?: () => void;
}

export default function ProfileCompletionBanner({
  progress = 0,
  incompleteFields = [],
  onProfileSaved,
}: ProfileCompletionBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const rounded = Math.round(progress);
  const isComplete = rounded >= 100;

  return (
    <>
      <div className={styles.banner}>
        <div className={styles.bannerTop}>
          <div className={styles.icon}>{isComplete ? "✅" : "⚡"}</div>
          <div className={styles.content}>
            <p className={styles.title}>
              {isComplete
                ? "Your profile is complete!"
                : "Complete your profile — get 3× more matches"}
            </p>
            <p className={styles.subtitle}>
              {isComplete
                ? "You're all set. Enjoy better visibility and more matches."
                : "Add missing details to unlock better visibility"}
            </p>
          </div>
          {!isComplete && (
            <button className={styles.cta} onClick={() => setModalOpen(true)}>
              Complete now
            </button>
          )}
        </div>

        <div className={styles.progressWrapper}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${rounded}%` }} />
          </div>
          <span className={styles.progressLabel}>{rounded}%</span>
        </div>
      </div>

      <ProfileCompleteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        incompleteFields={incompleteFields}
        onSaved={() => {
          setModalOpen(false);
          onProfileSaved?.();
        }}
      />
    </>
  );
}