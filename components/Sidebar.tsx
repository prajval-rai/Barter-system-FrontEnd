"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingBag, Package, PlusCircle, MessageCircle,
  Bell, Heart, Settings, ShieldCheck,
  LogOut, Zap, User, ChevronDown,
} from "lucide-react";
import styles from "../styles/Sidebar.module.css";
import type { AuthUser } from "@/context/AuthContext";
import { useUnreadSocket } from "../app/hooks/useUnreadSocket";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION UNREAD COUNT
───────────────────────────────────────────────────────────────────────────── */
function useNotifUnread(pathname: string) {
  const [count, setCount] = useState(0);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}accounts/notifications/unread-count/`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data: { unread_count: number } = await res.json();
      setCount(data.unread_count);
    } catch {}
  }, []);
  useEffect(() => { refresh(); }, [pathname, refresh]);
  return { count, refresh };
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "marketplace",   label: "Marketplace",   Icon: ShoppingBag },
  { id: "my-products",   label: "My Products",   Icon: Package },
  { id: "add-product",   label: "Add Product",   Icon: PlusCircle },
  { id: "chats",         label: "Trade Chats",   Icon: MessageCircle },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "wishlist",      label: "Wishlist",       Icon: Heart },
];

const ADMIN_ITEM = { id: "manage-marketplace", label: "Manage", Icon: ShieldCheck };

/* ─────────────────────────────────────────────────────────────────────────────
   PROPS
───────────────────────────────────────────────────────────────────────────── */
interface NavbarProps {
  user: AuthUser;
  onSignOut: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function Navbar({ user, onSignOut }: NavbarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const isAdmin = user.role === "Admin";

  const chatUnread                                     = useUnreadSocket(user?.email);
  const { count: notifUnread, refresh: refreshNotif } = useNotifUnread(pathname);

  useEffect(() => {
    if (pathname === "/notifications") refreshNotif();
  }, [pathname, refreshNotif]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-usermenu]"))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (showUserMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showUserMenu]);

  const navigate = (id: string) => {
    router.push(`/${id}`);
    setShowUserMenu(false);
  };

  const isActive = (id: string) =>
    pathname === `/${id}` || pathname.startsWith(`/${id}/`);

  const getBadge = (id: string): number | undefined => {
    if (id === "chats")         return chatUnread  > 0 ? chatUnread  : undefined;
    if (id === "notifications") return notifUnread > 0 ? notifUnread : undefined;
    return undefined;
  };

  const items = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  const initials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user.name?.[0] ?? "U";

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name;

  /* ── shared user menu content ── */
  const UserMenuContent = () => (
    <>
      <div className={styles.dropProfile}>
        <div className={styles.dropAvatarWrap}>
          {user.image
            ? <img src={user.image} alt={displayName} className={styles.dropAvatarImg} referrerPolicy="no-referrer" />
            : <div className={styles.dropAvatarInitials}>{initials}</div>}
          <span className={styles.dropOnlineDot} />
        </div>
        <div className={styles.dropProfileText}>
          <p className={styles.dropName}>{displayName}</p>
          <p className={styles.dropEmail}>{user.email}</p>
          <span className={`${styles.rolePill} ${isAdmin ? styles.rolePillAdmin : styles.rolePillUser}`}>
            {isAdmin ? <><ShieldCheck size={8} /> Admin</> : <><User size={8} /> Member</>}
          </span>
        </div>
      </div>

      <div className={styles.dropDivider} />
      <button className={styles.dropItem} onClick={() => navigate("profile")}>
        <User size={14} /> My Profile
      </button>
      <button className={styles.dropItem} onClick={() => navigate("settings")}>
        <Settings size={14} /> Settings
      </button>

      {isAdmin && (
        <>
          <div className={styles.dropDivider} />
          <button className={`${styles.dropItem} ${styles.dropItemAdmin}`} onClick={() => navigate("manage-marketplace")}>
            <ShieldCheck size={14} /> Manage Marketplace
          </button>
        </>
      )}

      <div className={styles.dropDivider} />
      <button
        className={`${styles.dropItem} ${styles.dropItemDanger}`}
        onClick={() => { setShowUserMenu(false); onSignOut(); }}
      >
        <LogOut size={14} /> Sign Out
      </button>
    </>
  );

  return (
    <>
      {/* ══════════════════════════════════════
          TOP NAVBAR  (tablet + desktop)
      ══════════════════════════════════════ */}
      <header className={styles.topBar}>

        {/* Logo */}
        <button className={styles.logo} onClick={() => navigate("marketplace")}>
          <div className={styles.logoIcon}><Zap size={15} strokeWidth={2.8} /></div>
          <span className={styles.logoText}>BarterX</span>
        </button>

        {/* Nav links */}
        <nav className={styles.navLinks}>
          {items.map(({ id, label, Icon }) => {
            const badge  = getBadge(id);
            const active = isActive(id);
            return (
              <button
                key={id}
                className={[
                  styles.navLink,
                  active ? styles.navLinkActive : "",
                  id === "manage-marketplace" ? styles.navLinkAdmin : "",
                ].join(" ")}
                onClick={() => navigate(id)}
              >
                <span className={styles.navLinkInner}>
                  <Icon size={15} strokeWidth={active ? 2.3 : 1.8} />
                  <span className={styles.navLinkLabel}>{label}</span>
                  {badge !== undefined && (
                    <span className={styles.badge}>{badge > 99 ? "99+" : badge}</span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Avatar / dropdown */}
        <div className={styles.avatarArea} data-usermenu>
          <button
            className={styles.avatarBtn}
            onClick={() => setShowUserMenu(p => !p)}
            data-usermenu
          >
            {user.image
              ? <img src={user.image} alt={displayName} className={styles.avatarImg} referrerPolicy="no-referrer" />
              : <span className={styles.avatarInitials}>{initials}</span>}
            <ChevronDown
              size={13}
              className={`${styles.chevron} ${showUserMenu ? styles.chevronOpen : ""}`}
            />
          </button>

          {showUserMenu && (
            <div className={styles.dropdown} data-usermenu>
              <UserMenuContent />
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════
          BOTTOM NAV  (mobile only ≤640px)
      ══════════════════════════════════════ */}
      <nav className={styles.bottomNav}>

        {/* First 4 items as tabs */}
        {items.slice(0, 4).map(({ id, label, Icon }) => {
          const badge  = getBadge(id);
          const active = isActive(id);
          return (
            <button
              key={id}
              className={`${styles.bottomItem} ${active ? styles.bottomItemActive : ""}`}
              onClick={() => navigate(id)}
            >
              <span className={styles.bottomIconWrap}>
                <Icon size={20} strokeWidth={active ? 2.3 : 1.7} />
                {badge !== undefined && (
                  <span className={styles.bottomBadge}>{badge > 99 ? "99+" : badge}</span>
                )}
              </span>
              <span className={styles.bottomLabel}>{label}</span>
            </button>
          );
        })}

        {/* "More" tab */}
        <div className={styles.bottomMoreWrap} data-usermenu>
          <button
            className={`${styles.bottomItem} ${showUserMenu ? styles.bottomItemActive : ""}`}
            onClick={() => setShowUserMenu(p => !p)}
            data-usermenu
          >
            <span className={styles.bottomIconWrap}>
              {user.image
                ? <img src={user.image} alt="" className={styles.bottomAvatar} referrerPolicy="no-referrer" />
                : <span className={styles.bottomAvatarInitials}>{initials}</span>}
              {items.slice(4).some(i => getBadge(i.id) !== undefined) && (
                <span className={styles.bottomBadge}>!</span>
              )}
            </span>
            <span className={styles.bottomLabel}>More</span>
          </button>

          {showUserMenu && (
            <div className={styles.bottomSheet} data-usermenu>
              <div className={styles.bottomSheetHandle} />

              {items.slice(4).map(({ id, label, Icon }) => {
                const badge  = getBadge(id);
                const active = isActive(id);
                return (
                  <button
                    key={id}
                    className={`${styles.dropItem} ${active ? styles.dropItemActive : ""}`}
                    onClick={() => navigate(id)}
                  >
                    <Icon size={15} /> {label}
                    {badge !== undefined && (
                      <span className={styles.dropBadge}>{badge > 99 ? "99+" : badge}</span>
                    )}
                  </button>
                );
              })}

              {items.slice(4).length > 0 && <div className={styles.dropDivider} />}

              <UserMenuContent />
            </div>
          )}
        </div>
      </nav>

      {/* Backdrop for mobile sheet */}
      {showUserMenu && (
        <div className={styles.mobileScrim} onClick={() => setShowUserMenu(false)} />
      )}
    </>
  );
}