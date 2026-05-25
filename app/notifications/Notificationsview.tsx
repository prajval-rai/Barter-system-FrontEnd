"use client";

import { useState } from "react";
import type { Notification } from "./page";
import styles from "./Notificationsview.module.css";

type Props = {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onDelete: (id: number) => void;
};

type Filter = "all" | "unread" | "read";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getTypeIcon(type?: string) {
  switch (type) {
    case "swap":    return <SwapIcon />;
    case "offer":   return <OfferIcon />;
    case "message": return <MessageIcon />;
    case "system":  return <SystemIcon />;
    default:        return <BellIcon />;
  }
}

function getTypeColor(type?: string): string {
  switch (type) {
    case "swap":    return "swap";
    case "offer":   return "offer";
    case "message": return "message";
    case "system":  return "system";
    default:        return "default";
  }
}

function NotificationCard({
  item,
  onMarkRead,
  onDelete,
}: {
  item: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [markingRead, setMarkingRead] = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const handleMarkRead = async () => {
    if (item.staus || markingRead) return;
    setMarkingRead(true);
    try {
      await fetch(`http://localhost:8000/accounts/notifications/${item.id}/read/`, {
        method: "PATCH",
        credentials: "include",
      });
      onMarkRead(item.id);
    } catch (e) {
      console.error(e);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await fetch(`http://localhost:8000/accounts/notifications/${item.id}/`, {
        method: "DELETE",
        credentials: "include",
      });
      onDelete(item.id);
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  return (
    <div
      className={`${styles.card} ${!item.staus ? styles.cardUnread : ""} ${deleting ? styles.cardDeleting : ""}`}
      onClick={handleMarkRead}
    >
      {/* Unread dot */}
      {!item.staus && <span className={styles.unreadDot} />}

      {/* Icon */}
      <div
        className={styles.iconWrap}
        data-type={getTypeColor(item.notification_type)}
      >
        {getTypeIcon(item.notification_type)}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <p className={styles.notifTitle}>{item.title}</p>
        <p className={styles.notifMessage}>{item.message}</p>
        <span className={styles.time}>{timeAgo(item.created_at)}</span>
      </div>

      {/* Actions */}
      <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
        {!item.staus && (
          <button
            className={styles.actionBtn}
            title="Mark as read"
            onClick={handleMarkRead}
            disabled={markingRead}
          >
            {markingRead ? <SpinnerIcon /> : <CheckIcon />}
          </button>
        )}
        <button
          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
          title="Delete"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <SpinnerIcon /> : <TrashIcon />}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonIcon} />
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLine} style={{ width: "50%", height: "14px" }} />
        <div className={styles.skeletonLine} style={{ width: "80%", height: "12px" }} />
        <div className={styles.skeletonLine} style={{ width: "30%", height: "10px" }} />
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconWrap}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="24" stroke="var(--color-border)" strokeWidth="2" />
          <path d="M26 14a8 8 0 018 8v5l2 3H16l2-3v-5a8 8 0 018-8z" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
          <path d="M23 33a3 3 0 006 0" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <p className={styles.emptyTitle}>
        {filter === "unread" ? "No unread notifications" :
         filter === "read"   ? "No read notifications"   :
                               "No notifications yet"}
      </p>
      <p className={styles.emptySubtitle}>
        {filter === "all"
          ? "You're all caught up! Notifications will appear here."
          : "Switch to 'All' to see your notification history."}
      </p>
    </div>
  );
}

export default function NotificationsView({
  notifications,
  loading,
  error,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.staus).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.staus;
    if (filter === "read")   return n.staus;
    return true;
  });

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await fetch("http://localhost:8000/notifications/notifications/read-all/", {
        method: "PATCH",
        credentials: "include",
      });
      onMarkAllRead();
    } catch (e) {
      console.error(e);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <BellIcon />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Notifications</h1>
            <p className={styles.pageSubtitle}>Stay updated on your activity</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          {unreadCount > 0 && (
            <div className={styles.unreadBadge}>
              {unreadCount} unread
            </div>
          )}
          <button
            className={styles.markAllBtn}
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll ? <SpinnerIcon /> : <DoubleCheckIcon />}
            Mark all read
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filters}>
        {(["all", "unread", "read"] as Filter[]).map((f) => (
          <button
            key={f}
            className={styles.filterBtn}
            data-active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "unread" && unreadCount > 0 && (
              <span className={styles.filterCount}>{unreadCount}</span>
            )}
            {f === "all" && notifications.length > 0 && (
              <span className={styles.filterCount}>{notifications.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBanner}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* List */}
      <div className={styles.list}>
        {loading ? (
          [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filtered.map((n) => (
            <NotificationCard
              key={n.id}
              item={n}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

    </div>
  );
}

/* ── Icons ── */
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}
function SwapIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/>
    </svg>
  );
}
function OfferIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  );
}
function SystemIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function DoubleCheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 3 9 11 5 7"/><polyline points="22 8 13 17 9 13"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}