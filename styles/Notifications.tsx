"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "@/styles/Pages.module.css";

// ─── Types ────────────────────────────────────────────────────
interface ApiNotification {
  id: number;
  title: string;
  description: string;
  redirect: string;
  staus: boolean; // note: API typo — "staus" not "status"
  user: number;
}

// ─── API helpers ──────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  // 204 No Content → return empty object
  if (res.status === 204) return {} as T;
  return res.json();
}

function fetchNotifications() {
  return apiFetch<ApiNotification[]>("/accounts/notifications/");
}

function fetchUnreadCount() {
  return apiFetch<{ unread_count: number }>("/accounts/notifications/unread-count/");
}

function markOneRead(id: number) {
  return apiFetch<unknown>(`/accounts/notifications/${id}/read/`, { method: "POST" });
}

function markAllReadApi() {
  return apiFetch<unknown>("/accounts/notifications/read-all/", { method: "POST" });
}

// ─── Hook ─────────────────────────────────────────────────────
export function useNotifications() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [notifs, countData] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(countData.unread_count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(async (id: number) => {
    try {
      await markOneRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, staus: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently ignore — optimistic update already applied
    }
  }, []);

  const markAll = useCallback(async () => {
    try {
      await markAllReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, staus: true })));
      setUnreadCount(0);
    } catch {
      // silently ignore
    }
  }, []);

  return { notifications, unreadCount, loading, error, reload: load, markRead, markAll };
}

// ─── NOTIFICATIONS PAGE ───────────────────────────────────────
export function Notifications({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { notifications, unreadCount, loading, error, markRead, markAll, reload } =
    useNotifications();

  // Reload whenever this page comes into view (parent re-mounts on tab change)
  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>🔔 Notifications</h1>
          <div className={styles.goldLine} />
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyText}>Loading notifications…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>🔔 Notifications</h1>
          <div className={styles.goldLine} />
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⚠️</div>
          <div className={styles.emptyText}>Failed to load notifications</div>
          <div className={styles.emptyHint}>{error}</div>
          <button
            className={`${styles.btn} ${styles.btnGold}`}
            style={{ marginTop: 16 }}
            onClick={reload}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <div>
            <h1 className={styles.pageTitle}>🔔 Notifications</h1>
            <p className={styles.pageSubtitle}>{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
          </div>
          {unreadCount > 0 && (
            <button
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
              onClick={markAll}
            >
              Mark all read
            </button>
          )}
        </div>
        <div className={styles.goldLine} />
      </div>

      {notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔔</div>
          <div className={styles.emptyText}>No notifications yet</div>
        </div>
      ) : (
        <div className={styles.card} style={{ padding: 0 }}>
          {notifications.map((n) => {
            const isUnread = !n.staus;
            return (
              <div
                key={n.id}
                className={`${styles.notifItem} ${isUnread ? styles.notifUnread : ""}`}
                onClick={() => isUnread && markRead(n.id)}
                style={{ cursor: isUnread ? "pointer" : "default" }}
              >
                {/* Icon derived from redirect path */}
                <span style={{ fontSize: 20 }}>
                  {n.redirect?.includes("order")
                    ? "📦"
                    : n.redirect?.includes("trade") || n.redirect?.includes("exchange")
                    ? "🔄"
                    : n.redirect?.includes("chat") || n.redirect?.includes("message")
                    ? "💬"
                    : "🔔"}
                </span>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: isUnread ? 700 : 500,
                      color: "var(--text-primary)",
                      lineHeight: 1.3,
                      marginBottom: 3,
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.description}
                  </div>
                </div>

                {isUnread && <div className={styles.notifDot} />}

                {n.redirect && (
                  <button
                    className={`${styles.btn} ${styles.btnGold} ${styles.btnSm}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isUnread) markRead(n.id);
                      // Navigate if redirect matches a known page id
                      const map: Record<string, string> = {
                        "/orders": "history",
                        "/trade": "requests",
                        "/exchange": "requests",
                        "/chat": "chats",
                        "/message": "chats",
                      };
                      const page = Object.entries(map).find(([k]) =>
                        n.redirect.startsWith(k)
                      )?.[1];
                      if (page) onNavigate(page);
                    }}
                  >
                    View
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}