"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home,
  ShoppingBag,
  ArrowLeftRight,
  Package,
  PlusCircle,
  MessageCircle,
  ClipboardList,
  Bell,
  User,
  Heart,
  Settings,
  ShieldCheck,
  LogOut,
  Zap,
  Menu,
  X,
} from "lucide-react";
import styles from "@/styles/Sidebar.module.css";
import type { AuthUser } from "@/context/AuthContext";

// ─── Unread-count hook ────────────────────────────────────────
/**
 * Fetches the notification unread count from the API.
 * Re-fetches whenever `activeId` changes (i.e. every page navigation)
 * so the badge stays fresh without a full polling loop.
 */
function useUnreadCount(activeId: string) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        "http://localhost:8000/accounts/notifications/unread-count/",
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data: { unread_count: number } = await res.json();
      setCount(data.unread_count);
    } catch {
      // network error — keep last known value
    }
  }, []);

  // Refresh on every page change
  useEffect(() => {
    refresh();
  }, [activeId, refresh]);

  return { count, refresh };
}

// ─── Nav config ───────────────────────────────────────────────
const navSections = [
  {
    label: "Main",
    items: [
      { id: "dashboard",   label: "Dashboard",         Icon: Home },
      { id: "marketplace", label: "Marketplace",       Icon: ShoppingBag },
      { id: "requests",    label: "Exchange Requests", Icon: ArrowLeftRight, badge: 2 },
    ],
  },
  {
    label: "Trade",
    items: [
      { id: "my-products", label: "My Products",   Icon: Package },
      { id: "add-product", label: "Add Product",   Icon: PlusCircle },
      { id: "chats",       label: "Trade Chats",   Icon: MessageCircle, badge: 1 },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "notifications", label: "Notifications", Icon: Bell }, // badge injected dynamically
      { id: "profile",       label: "My Profile",    Icon: User },
      { id: "wishlist",      label: "Wishlist",      Icon: Heart },
      { id: "settings",      label: "Settings",      Icon: Settings },
    ],
  },
];

const adminSection = {
  label: "Admin",
  items: [{ id: "manage-marketplace", label: "Manage", Icon: ShieldCheck }],
};

// ─── Props ────────────────────────────────────────────────────
interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  user: AuthUser;
  onSignOut: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────
export default function Sidebar({
  activeId,
  onSelect,
  user,
  onSignOut,
  onCollapsedChange,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isAdmin = user.role === "Admin";

  // Live unread count — re-fetched on every activeId change
  const { count: unreadCount } = useUnreadCount(activeId);

  const sections = isAdmin
    ? [navSections[0], navSections[1], adminSection, navSections[2]]
    : navSections;

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

  /**
   * Badge resolution:
   *  - "notifications" → live API unread count
   *  - everything else  → static badge from config (if any)
   */
  const getBadge = (item: { id: string; badge?: number }) => {
    if (item.id === "notifications") return unreadCount > 0 ? unreadCount : undefined;
    return item.badge;
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

      {/* Mobile hamburger — hidden on desktop via CSS */}
      <button className={styles.hamburger} onClick={() => setMobileOpen(true)}>
        <Menu size={20} />
      </button>

      <aside className={`${styles.rail} ${mobileOpen ? styles.mobileOpen : ""}`}>

        {/* Mobile close */}
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
                const badge = getBadge(item as any);
                const isActive = activeId === item.id;
                const isAdminItem = item.id === "manage-marketplace";
                return (
                  <div key={item.id} className={styles.itemWrap}>
                    <button
                      className={[
                        styles.navBtn,
                        isActive ? styles.navBtnActive : "",
                        isAdminItem ? styles.navBtnAdmin : "",
                      ].join(" ")}
                      onClick={() => handleSelect(item.id)}
                    >
                      <item.Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
                      {badge ? <span className={styles.badge}>{badge}</span> : null}
                    </button>
                    <span className={styles.tooltip}>{item.label}</span>
                  </div>
                );
              })}
              {si < sections.length - 1 && <div className={styles.groupDivider} />}
            </div>
          ))}
        </nav>

        {/* ── Avatar at bottom ── */}
        <div className={styles.bottom}>
          <div className={styles.hr} />
          <div className={styles.avatarWrap} data-usermenu>
            <button
              className={styles.avatarBtn}
              onClick={() => setShowUserMenu((p) => !p)}
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
                      <img src={user.image} alt={displayName} className={styles.popupAvatarImg} referrerPolicy="no-referrer" />
                    ) : (
                      <div className={styles.popupAvatarInitials}>{initials}</div>
                    )}
                    <span className={styles.popupOnlineDot} />
                  </div>
                  <div>
                    <p className={styles.popupName}>{displayName}</p>
                    <p className={styles.popupEmail}>{user.email}</p>
                    <span className={`${styles.rolePill} ${isAdmin ? styles.rolePillAdmin : styles.rolePillUser}`}>
                      {isAdmin ? <><ShieldCheck size={9} /> Admin</> : <><User size={9} /> Member</>}
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
                    <button className={`${styles.popupItem} ${styles.popupItemAdmin}`} onClick={() => handleSelect("manage-marketplace")}>
                      <ShieldCheck size={14} /> Manage Marketplace
                    </button>
                  </>
                )}

                <div className={styles.popupDivider} />
                <button className={`${styles.popupItem} ${styles.popupItemDanger}`} onClick={() => { setShowUserMenu(false); onSignOut(); }}>
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