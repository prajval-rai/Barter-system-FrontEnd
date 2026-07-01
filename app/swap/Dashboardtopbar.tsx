"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "./Dashboardtopbar.module.css";
import { useAuth } from "@/context/AuthContext";

interface DashboardTopBarProps {
  completionPercentage?: number;
}

export default function DashboardTopBar({ completionPercentage = 0 }: DashboardTopBarProps) {
  const { user } = useAuth();

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completionPercentage / 100) * circumference;

  return (
    <header className={styles.topbar}>
      {/* Search */}
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search items, users or categories..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        {/* Profile completion ring */}
        {completionPercentage < 100 && (
          <Link href="/profile" className={styles.progressBtn} aria-label={`Profile ${completionPercentage}% complete`}>
            <svg width="40" height="40" viewBox="0 0 40 40" className={styles.progressSvg}>
              <circle
                cx="20" cy="20" r={radius}
                className={styles.progressTrack}
                fill="none"
                strokeWidth="3"
              />
              <circle
                cx="20" cy="20" r={radius}
                className={styles.progressFill}
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 20 20)"
              />
            </svg>
            <span className={styles.progressText}>{completionPercentage}%</span>
          </Link>
        )}

        {/* Notifications */}
        <Link href="/notifications" className={styles.iconBtn} aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className={styles.badge}>3</span>
        </Link>

        {/* Avatar */}
        <Link href="/profile" className={styles.avatarBtn}>
          <div className={styles.avatarRing}>
            {user?.image ? (
              <Image src={user.image} alt={user.name} width={32} height={32} style={{ borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div className={styles.avatarInitials}>
                {(user?.name ?? "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <span className={styles.avatarName}>{user?.name ?? "Account"}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
