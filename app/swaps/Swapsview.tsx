"use client";

import { useState } from "react";
import type { BarterRequest } from "./page";
import styles from "./Swapsview.module.css";

type Props = {
  completed: BarterRequest[];
  rejected: BarterRequest[];
  loading: boolean;
  error: string | null;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SwapCard({ item }: { item: BarterRequest }) {
  const isCompleted = item.status === "completed";

  return (
    <div className={styles.card}>
      <div className={styles.cardBadge} data-status={item.status}>
        {isCompleted ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
      </div>

      <div className={styles.productsRow}>
        {/* Offered Product */}
        <div className={styles.productBox}>
          <div className={styles.productImageWrap}>
            <img
              src={item.request_product.thumbnail}
              alt={item.request_product.title}
              className={styles.productImage}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/120x120/EBF2FF/1A56DB?text=No+Image";
              }}
            />
          </div>
          <div className={styles.productInfo}>
            <span className={styles.productCategory}>
              {item.request_product.category_name}
            </span>
            <h3 className={styles.productTitle}>{item.request_product.title}</h3>
            <span className={styles.productOwner}>by {item.from_user.split("@")[0]}</span>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className={styles.swapArrow}>
          <div className={styles.arrowCircle}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10h14M13 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Requested Product */}
        <div className={styles.productBox}>
          <div className={styles.productImageWrap}>
            <img
              src={item.request_for_product.thumbnail}
              alt={item.request_for_product.title}
              className={styles.productImage}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/120x120/EBF2FF/1A56DB?text=No+Image";
              }}
            />
          </div>
          <div className={styles.productInfo}>
            <span className={styles.productCategory}>
              {item.request_for_product.category_name}
            </span>
            <h3 className={styles.productTitle}>{item.request_for_product.title}</h3>
            <span className={styles.productOwner}>by {item.to_user.split("@")[0]}</span>
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.footerMeta}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1 5.5h12M4.5 1v2.5M9.5 1v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {formatDate(item.created_at)}
        </div>

        {item.last_message && (
          <div className={styles.lastMessage}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 2h9a1 1 0 011 1v6a1 1 0 01-1 1H4l-3 2V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            {item.last_message}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ type }: { type: "completed" | "rejected" }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        {type === "completed" ? (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="var(--color-border)" strokeWidth="2" />
            <path d="M12 20l6 6 10-10" stroke="var(--color-text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="var(--color-border)" strokeWidth="2" />
            <path d="M13 13l14 14M27 13L13 27" stroke="var(--color-text-muted)" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <p className={styles.emptyTitle}>No {type} swaps yet</p>
      <p className={styles.emptySubtitle}>
        {type === "completed"
          ? "Your successfully completed swaps will appear here."
          : "Swaps that were declined will appear here."}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonBadge} />
      <div className={styles.skeletonRow}>
        <div className={styles.skeletonProduct}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonLines}>
            <div className={styles.skeletonLine} style={{ width: "60%" }} />
            <div className={styles.skeletonLine} style={{ width: "80%" }} />
            <div className={styles.skeletonLine} style={{ width: "50%" }} />
          </div>
        </div>
        <div className={styles.skeletonArrow} />
        <div className={styles.skeletonProduct}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonLines}>
            <div className={styles.skeletonLine} style={{ width: "60%" }} />
            <div className={styles.skeletonLine} style={{ width: "80%" }} />
            <div className={styles.skeletonLine} style={{ width: "50%" }} />
          </div>
        </div>
      </div>
      <div className={styles.skeletonFooter}>
        <div className={styles.skeletonLine} style={{ width: "30%" }} />
      </div>
    </div>
  );
}

export default function SwapsView({ completed, rejected, loading, error }: Props) {
  const [activeTab, setActiveTab] = useState<"completed" | "rejected">("completed");

  const activeData = activeTab === "completed" ? completed : rejected;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 11h16M15 6l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className={styles.pageTitle}>My Swaps</h1>
            <p className={styles.pageSubtitle}>Track your barter history</p>
          </div>
        </div>

        <div className={styles.statsPills}>
          <div className={styles.statPill} data-type="completed">
            <span className={styles.statCount}>{completed.length}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.statPill} data-type="rejected">
            <span className={styles.statCount}>{rejected.length}</span>
            <span className={styles.statLabel}>Rejected</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          <button
            className={styles.tab}
            data-active={activeTab === "completed"}
            onClick={() => setActiveTab("completed")}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2.5 7.5l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Completed
            <span className={styles.tabCount}>{completed.length}</span>
          </button>
          <button
            className={styles.tab}
            data-active={activeTab === "rejected"}
            onClick={() => setActiveTab("rejected")}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M3 3l9 9M12 3L3 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Rejected
            <span className={styles.tabCount}>{rejected.length}</span>
          </button>
        </div>
        <div className={styles.tabUnderline}>
          <div
            className={styles.tabIndicator}
            style={{ transform: activeTab === "rejected" ? "translateX(100%)" : "translateX(0)" }}
          />
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {error && (
          <div className={styles.errorBanner}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className={styles.list}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : activeData.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <div className={styles.list}>
            {activeData.map((item) => (
              <SwapCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}