"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, Package, PlusCircle, MessageCircle,
  Bell, User, Heart, Settings, ShieldCheck,
  LogOut, Zap, Menu, X,
} from "lucide-react";
import styles from "@/styles/Sidebar.module.css";
import type { AuthUser } from "@/context/AuthContext";
import { useUnreadSocket } from "../app/hooks/useUnreadSocket";   // ← the hook from last response

const API_BASE = "http://localhost:8000";

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION UNREAD COUNT  (unchanged)
───────────────────────────────────────────────────────────────────────────── */
function useNotifUnread(activeId: string) {
  const [count, setCount] = useState(0);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/accounts/notifications/unread-count/`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data: { unread_count: number } = await res.json();
      setCount(data.unread_count);
    } catch {}
  }, []);
  useEffect(() => { refresh(); }, [activeId, refresh]);
  return { count, refresh };
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { id: "marketplace", label: "Marketplace", Icon: ShoppingBag },
    ],
  },
  {
    label: "Trade",
    items: [
      { id: "my-products", label: "My Products",  Icon: Package },
      { id: "add-product", label: "Add Product",  Icon: PlusCircle },
      { id: "chats",       label: "Trade Chats",  Icon: MessageCircle },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "notifications", label: "Notifications", Icon: Bell },
      { id: "wishlist",      label: "Wishlist",       Icon: Heart },
    ],
  },
];

const ADMIN_SECTION = {
  label: "Admin",
  items: [{ id: "manage-marketplace", label: "Manage", Icon: ShieldCheck }],
};

/* ─────────────────────────────────────────────────────────────────────────────
   PROPS
───────────────────────────────────────────────────────────────────────────── */
interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  user: AuthUser;
  onSignOut: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function Sidebar({
  activeId, onSelect, user, onSignOut, onCollapsedChange,
}: SidebarProps) {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isAdmin = user.role === "Admin";

  // ── Live chat unread count via WebSocket (useUnreadSocket handles
  //    connect / reconnect / token fetching internally) ──────────────────────
  const chatUnread = useUnreadSocket(user?.email);

  // ── Notification unread count via REST poll ───────────────────────────────
  const { count: notifUnread, refresh: refreshNotif } = useNotifUnread(activeId);

  // Ping for a fresh notif count when user navigates to that section
  useEffect(() => {
    if (activeId === "notifications") refreshNotif();
  }, [activeId, refreshNotif]);

  const sections = isAdmin
    ? [NAV_SECTIONS[0], NAV_SECTIONS[1], ADMIN_SECTION, NAV_SECTIONS[2]]
    : NAV_SECTIONS;

  useEffect(() => { onCollapsedChange?.(true); }, []);

  useEffect(() => {
    const r = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-usermenu]"))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSelect = (id: string) => {
    onSelect(id);
    setMobileOpen(false);
    setShowUserMenu(false);
  };

  // Map item id → badge count (undefined = no badge rendered at all)
  const getBadge = (id: string): number | undefined => {
    if (id === "chats")         return chatUnread  > 0 ? chatUnread  : undefined;
    if (id === "notifications") return notifUnread > 0 ? notifUnread : undefined;
    return undefined;
  };

  const initials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user.name?.[0] ?? "U";

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name;

  return (
    <>
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      <button className={styles.hamburger} onClick={() => setMobileOpen(true)}>
        <Menu size={20} />
      </button>

      <aside className={`${styles.rail} ${mobileOpen ? styles.mobileOpen : ""}`}>

        <button className={styles.closeBtn} onClick={() => setMobileOpen(false)}>
          <X size={16} />
        </button>

        {/* ── Logo ── */}
        <div className={styles.logoSlot}>
          <div className={styles.logoIcon}>
            <Zap size={16} strokeWidth={2.5} />
          </div>
        </div>

        <div className={styles.hr} />

        {/* ── Nav ── */}
        <nav className={styles.nav}>
          {sections.map((section, si) => (
            <div key={si} className={styles.group}>
              {section.items.map((item) => {
                const badge    = getBadge(item.id);
                const isActive = activeId === item.id;
                return (
                  <div key={item.id} className={styles.itemWrap}>
                    <button
                      className={[
                        styles.navBtn,
                        isActive ? styles.navBtnActive : "",
                        item.id === "manage-marketplace" ? styles.navBtnAdmin : "",
                      ].join(" ")}
                      onClick={() => handleSelect(item.id)}
                      aria-label={item.label}
                    >
                      <item.Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />

                      {badge !== undefined && (
                        <span
                          className={styles.badge}
                          style={{ minWidth: badge > 9 ? 18 : 16 }}
                        >
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </button>
                    <span className={styles.tooltip}>{item.label}</span>
                  </div>
                );
              })}
              {si < sections.length - 1 && <div className={styles.groupDivider} />}
            </div>
          ))}
        </nav>

        {/* ── Avatar / user menu ── */}
        <div className={styles.bottom}>
          <div className={styles.hr} />
          <div className={styles.avatarWrap} data-usermenu>
            <button
              className={styles.avatarBtn}
              onClick={() => setShowUserMenu((p) => !p)}
              aria-label="Account menu"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={displayName}
                  className={styles.avatarImg}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
              <span className={styles.onlineDot} />
            </button>
            <span className={styles.tooltip}>{displayName}</span>

            {showUserMenu && (
              <div className={styles.popup} data-usermenu>
                <div className={styles.popupProfile}>
                  <div className={styles.popupAvatarWrap}>
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={displayName}
                        className={styles.popupAvatarImg}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={styles.popupAvatarInitials}>{initials}</div>
                    )}
                    <span className={styles.popupOnlineDot} />
                  </div>
                  <div>
                    <p className={styles.popupName}>{displayName}</p>
                    <p className={styles.popupEmail}>{user.email}</p>
                    <span
                      className={`${styles.rolePill} ${
                        isAdmin ? styles.rolePillAdmin : styles.rolePillUser
                      }`}
                    >
                      {isAdmin
                        ? <><ShieldCheck size={9} /> Admin</>
                        : <><User size={9} /> Member</>}
                    </span>
                  </div>
                </div>

                <div className={styles.popupDivider} />
                <button className={styles.popupItem} onClick={() => handleSelect("profile")}>
                  <User size={14} /> My Profile
                </button>
                <button className={styles.popupItem} onClick={() => handleSelect("settings")}>
                  <Settings size={14} /> Settings
                </button>

                {isAdmin && (
                  <>
                    <div className={styles.popupDivider} />
                    <button
                      className={`${styles.popupItem} ${styles.popupItemAdmin}`}
                      onClick={() => handleSelect("manage-marketplace")}
                    >
                      <ShieldCheck size={14} /> Manage Marketplace
                    </button>
                  </>
                )}

                <div className={styles.popupDivider} />
                <button
                  className={`${styles.popupItem} ${styles.popupItemDanger}`}
                  onClick={() => { setShowUserMenu(false); onSignOut(); }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}