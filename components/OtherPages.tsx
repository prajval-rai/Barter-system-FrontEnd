"use client";

import { useState,useEffect,useCallback } from "react";
import styles from "@/styles/Pages.module.css";
import { currentUser, products, notifications as notifData } from "@/data/mockData";


// ─── NOTIFICATIONS ───────────────────────────────────────────

interface ApiNotification {
  id: number;
  title: string;
  description: string;
  redirect: string;
  staus: boolean; // note: API typo — "staus" not "status"
  user: number;
}
const BASE = "http://localhost:8000";

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
  return apiFetch<unknown>(`/accounts/notifications/${id}/read/`, { method: "PATCH" });
}

function markAllReadApi() {
  return apiFetch<unknown>("/accounts/notifications/read-all/", { method: "PATCH" });
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



// ─── WISHLIST ─────────────────────────────────────────────────
export function Wishlist({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [wishlist, setWishlist] = useState(products.slice(1, 5));

  return (
    <div className={styles.pageWrap}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <div>
            <h1 className={styles.pageTitle}>❤️ Wishlist</h1>
            <p className={styles.pageSubtitle}>{wishlist.length} saved items</p>
          </div>
        </div>
        <div className={styles.goldLine} />
      </div>

      {wishlist.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>❤️</div>
          <div className={styles.emptyText}>Your wishlist is empty</div>
          <button className={`${styles.btn} ${styles.btnGold}`} style={{ marginTop: 16 }} onClick={() => onNavigate("marketplace")}>
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className={styles.grid3}>
          {wishlist.map((p) => (
            <div key={p.id} className={styles.productCard}>
              <div className={styles.productEmoji}>{p.images[0]}</div>
              <div className={styles.productBody}>
                <div className={styles.productTitle}>{p.title}</div>
                <div className={styles.productMeta}>
                  <span className="badge badge-gold">{p.condition}</span>
                  <span className={styles.productValue}>₹{p.estimatedValue.toLocaleString()}</span>
                </div>
                <div className={styles.productOwner}>
                  <div className={styles.ownerAvatar}>{p.owner.avatar}</div>
                  {p.owner.name}
                </div>
              </div>
              <div className={styles.productFooter}>
                <button className={`${styles.btn} ${styles.btnGold} ${styles.btnSm}`} style={{ flex: 1 }} onClick={() => onNavigate("marketplace")}>
                  🔄 Request
                </button>
                <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => setWishlist((w) => w.filter((x) => x.id !== p.id))}>
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────
export function Settings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    tradeAlerts: true,
    profilePublic: true,
    showLocation: true,
    autoAccept: false,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((p) => ({ ...p, [key]: !p[key] }));

  const Toggle = ({ label, desc, settingKey }: { label: string; desc: string; settingKey: keyof typeof settings }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
      </div>
      <button
        onClick={() => toggle(settingKey)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          background: settings[settingKey] ? "var(--gold)" : "var(--border)",
          position: "relative",
          cursor: "pointer",
          transition: "background var(--transition)",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute",
          top: 3,
          left: settings[settingKey] ? 22 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          transition: "left var(--transition)",
          display: "block",
        }} />
      </button>
    </div>
  );

  return (
    <div className={styles.pageWrap}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>⚙️ Settings</h1>
        <div className={styles.goldLine} />
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3 style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 4 }}>🔔 Notifications</h3>
          <Toggle label="Email Notifications" desc="Receive trade updates via email" settingKey="emailNotifications" />
          <Toggle label="Push Notifications" desc="Browser push notifications" settingKey="pushNotifications" />
          <Toggle label="Trade Alerts" desc="Alerts when someone requests your item" settingKey="tradeAlerts" />
        </div>

        <div className={styles.card}>
          <h3 style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 4 }}>🔒 Privacy</h3>
          <Toggle label="Public Profile" desc="Allow others to view your profile" settingKey="profilePublic" />
          <Toggle label="Show Location" desc="Display your city on listings" settingKey="showLocation" />
          <Toggle label="Auto-Accept Requests" desc="Auto-accept exchange requests" settingKey="autoAccept" />
        </div>

        <div className={styles.card}>
          <h3 style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 14 }}>🔑 Account</h3>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email Address</label>
            <input className={styles.formInput} defaultValue="alex.morgan@example.com" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Location</label>
            <input className={styles.formInput} defaultValue="Mumbai, IN" />
          </div>
          <button className={`${styles.btn} ${styles.btnGold}`}>Save Changes</button>
        </div>

        <div className={styles.card}>
          <h3 style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif", fontSize: 15, marginBottom: 14 }}>🛡️ Security</h3>
          <button className={`${styles.btn} ${styles.btnOutline}`} style={{ width: "100%", marginBottom: 10, justifyContent: "center" }}>
            🔐 Change Password
          </button>
          <button className={`${styles.btn} ${styles.btnOutline}`} style={{ width: "100%", marginBottom: 10, justifyContent: "center" }}>
            📱 Enable 2FA
          </button>
          <button className={`${styles.btn} ${styles.btnDanger}`} style={{ width: "100%", justifyContent: "center" }}>
            🗑️ Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}