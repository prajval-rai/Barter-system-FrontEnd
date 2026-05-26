"use client";

import { useState } from "react";
import type { BookmarkItem } from "./page";
import styles from "./Bookmarksview.module.css";

type Props = {
  bookmarks: BookmarkItem[];
  loading: boolean;
  error: string | null;
  onRemove: (productId: number) => void;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function conditionColor(condition: string) {
  switch (condition) {
    case "Brand New": return "new";
    case "Line New":  return "likenew";
    case "Good":      return "good";
    case "Fair":      return "fair";
    default:          return "good";
  }
}

function BookmarkCard({
  item,
  onRemove,
}: {
  item: BookmarkItem;
  onRemove: (productId: number) => void;
}) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    const base_url    = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (removing) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `${base_url}products/bookmark/${item.product_id}/remove/`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to remove bookmark");
      onRemove(item.product_id);
    } catch (err) {
      console.error(err);
      setRemoving(false);
    }
  };

  return (
    <div className={`${styles.card} ${removing ? styles.cardRemoving : ""}`}>
      {/* Thumbnail */}
      <div className={styles.imageWrap}>
        <img
          src={item.thumbnail}
          alt={item.title}
          className={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/200x200/EBF2FF/1A56DB?text=No+Image";
          }}
        />
        <div className={styles.categoryPill}>{item.category}</div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.infoTop}>
          <h3 className={styles.title}>{item.title}</h3>

          <div className={styles.badges}>
            <span
              className={styles.conditionBadge}
              data-condition={conditionColor(item.condition)}
            >
              {item.condition}
            </span>
            <span className={styles.statusBadge} data-status={item.product_status}>
              {item.product_status.charAt(0).toUpperCase() + item.product_status.slice(1)}
            </span>
          </div>
        </div>

        <div className={styles.infoBottom}>
          <div className={styles.date}>
            <CalendarIcon />
            Saved {formatDate(item.created_at)}
          </div>

          <div className={styles.actions}>
            <a
              href={`/products/${item.product_id}`}
              className={styles.viewBtn}
            >
              <EyeIcon />
              View
            </a>
            <button
              className={styles.removeBtn}
              onClick={handleRemove}
              disabled={removing}
              title="Remove bookmark"
            >
              {removing ? <SpinnerIcon /> : <HeartFilledIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonInfo}>
        <div className={styles.skeletonLine} style={{ width: "70%", height: "20px" }} />
        <div className={styles.skeletonLine} style={{ width: "40%", height: "14px" }} />
        <div className={styles.skeletonLine} style={{ width: "55%", height: "14px" }} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconWrap}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="var(--color-border)" strokeWidth="2" />
          <path
            d="M24 34s-12-7.5-12-15a8 8 0 0116 0 8 8 0 0116 0c0 7.5-12 15-12 15z"
            stroke="var(--color-text-muted)"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <p className={styles.emptyTitle}>No bookmarks yet</p>
      <p className={styles.emptySubtitle}>
        Items you save will appear here. Browse the marketplace to find something you love.
      </p>
      <a href="/marketplace" className={styles.emptyBtn}>
        Browse Marketplace
      </a>
    </div>
  );
}

export default function BookmarksView({ bookmarks, loading, error, onRemove }: Props) {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <BookmarkIcon />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Bookmarks</h1>
            <p className={styles.pageSubtitle}>Items you've saved for later</p>
          </div>
        </div>

        {!loading && (
          <div className={styles.countPill}>
            <span className={styles.countNum}>{bookmarks.length}</span>
            <span className={styles.countLabel}>saved</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBanner}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : bookmarks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={styles.grid}>
          {bookmarks.map((item) => (
            <BookmarkCard key={item.id} item={item} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Icons ── */
function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 5.5h12M4.5 1v2.5M9.5 1v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}