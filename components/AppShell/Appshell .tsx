"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./Appshell.module.css";
import { useAuth } from "@/context/AuthContext"; // adjust path if different
import Image from "next/image";

/* ─────────────────────────────────────────
   Inline SVG icon primitive
───────────────────────────────────────── */
function Icon({ paths, size = 20 }: { paths: string[]; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────
   Avatar helper — shows image or initials
───────────────────────────────────────── */
function Avatar({ image, name, size = 32 }: { image: string | null; name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={styles.avatarImg}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          width={size}
          height={size}
          style={{ borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Nav items
───────────────────────────────────────── */
const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    badge: null,
    showInBottom: false,
    icon: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"],
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    badge: null,
    showInBottom: true,
    icon: [
      "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z",
      "M3 6h18",
      "M16 10a4 4 0 01-8 0",
    ],
  },
  {
    label: "My Listings",
    href: "/listings",
    badge: null,
    showInBottom: false,
    icon: [
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2",
      "M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      "M9 12h6M9 16h4",
    ],
  },
  {
    label: "My Swaps",
    href: "/swaps",
    badge: null,
    showInBottom: false,
    icon: ["M7 16V4m0 0L3 8m4-4l4 4", "M17 8v12m0 0l4-4m-4 4l-4-4"],
  },
  {
    label: "Messages",
    href: "/messages",
    badge: 2,
    showInBottom: true,
    icon: ["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"],
  },
  {
    label: "Offers",
    href: "/offers",
    badge: 4,
    showInBottom: true,
    icon: [
      "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    ],
  },
  {
    label: "Bookmarks",
    href: "/bookmarks",
    badge: null,
    showInBottom: false,
    icon: ["M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"],
  },
  {
    label: "Notifications",
    href: "/notifications",
    badge: null,
    showInBottom: false,
    icon: [
      "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9",
      "M13.73 21a2 2 0 01-3.46 0",
    ],
  },
  {
    label: "Profile",
    href: "/profile",
    badge: null,
    showInBottom: true,
    icon: [
      "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2",
      "M12 11a4 4 0 100-8 4 4 0 000 8z",
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    badge: null,
    showInBottom: false,
    icon: [
      "M12 15a3 3 0 100-6 3 3 0 000 6z",
      "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
    ],
  },
];

/* ─────────────────────────────────────────
   DESKTOP SIDEBAR
───────────────────────────────────────── */
function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
    >
      {/* Logo */}
      <div className={styles.logoRow}>
        <Link href="/dashboard" className={styles.logoLink}>
          <span className={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {!collapsed && <span className={styles.logoText}>Exchangeit</span>}
        </Link>

        <button
          className={styles.collapseBtn}
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
      </div>

      {/* Add New Item */}
      <div className={styles.ctaWrap}>
        <Link href="/listings/new" className={styles.ctaBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {!collapsed && <span>Add New Item</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className={styles.nav} aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>
                <Icon paths={item.icon} size={18} />
              </span>
              {!collapsed && (
                <span className={styles.navLabel}>{item.label}</span>
              )}
              {item.badge !== null && (
                <span
                  className={`${styles.badge} ${collapsed ? styles.badgeCollapsed : ""}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Banner */}
      {!collapsed && (
        <div className={styles.upgradeBanner}>
          <div className={styles.upgradeHeader}>
            <span className={styles.upgradeCrown}>👑</span>
            <span className={styles.upgradeTitle}>Upgrade to Premium</span>
          </div>
          <p className={styles.upgradeDesc}>
            Get more visibility, priority matches and exclusive benefits.
          </p>
          <Link href="/upgrade" className={styles.upgradeBtn}>
            Upgrade Now
          </Link>
        </div>
      )}

      {/* User + Logout at bottom */}
      {!collapsed && user && (
        <div className={styles.sidebarUser}>
          <div className={styles.avatarRing}>
            <Avatar image={user.image} name={user.name} size={30} />
          </div>
          <div className={styles.sidebarUserInfo}>
            <span className={styles.sidebarUserName}>{user.name}</span>
            <span className={styles.sidebarUserEmail}>{user.email}</span>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={logout}
            aria-label="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      )}

      {!collapsed && (
        <Link href="/help" className={styles.helpLink}>
          <span>Need Help?</span>
          <span className={styles.helpSub}>Visit our Help Center →</span>
        </Link>
      )}
    </aside>
  );
}

/* ─────────────────────────────────────────
   DESKTOP TOPBAR
───────────────────────────────────────── */
function TopBar() {
  const { user, logout } = useAuth();

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
          placeholder="Search for items, categories or users..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.topbarRight}>
        {/* Location from user context */}
        <button className={styles.locationBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{user?.address ?? "Location"}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div className={styles.topbarDivider} />

        {/* Messages */}
        <Link href="/messages" className={styles.iconBtn} aria-label="Messages">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </Link>

        {/* Notifications */}
        <Link href="/notifications" className={styles.iconBtn} aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className={styles.notifBadge}>3</span>
        </Link>

        {/* Avatar — from AuthContext */}
        <Link href="/profile" className={styles.avatarBtn} aria-label="Profile">
          <div className={styles.avatarRing}>
            <Avatar image={user?.image ?? null} name={user?.name ?? "U"} size={30} />
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

/* ─────────────────────────────────────────
   MOBILE TOP BAR (header only)
───────────────────────────────────────── */
function MobileTopBar() {
  const { user } = useAuth();

  return (
    <header className={styles.mobileTopbar}>
      {/* Logo left */}
      <Link href="/dashboard" className={styles.mobileLogoLink}>
        <span className={styles.logoIcon} style={{ width: 30, height: 30 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className={styles.logoText}>Exchangeit</span>
      </Link>

      {/* Right actions */}
      <div className={styles.mobileTopbarRight}>
        {/* Search icon */}
        <Link href="/search" className={styles.iconBtn} aria-label="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </Link>

        {/* Notifications */}
        <Link href="/notifications" className={styles.iconBtn} aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className={styles.notifBadge}>3</span>
        </Link>

        {/* Avatar */}
        <Link href="/profile" className={styles.mobileAvatarBtn} aria-label="Profile">
          <div className={styles.avatarRing} style={{ width: 34, height: 34 }}>
            <Avatar image={user?.image ?? null} name={user?.name ?? "U"} size={28} />
          </div>
        </Link>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────
   MOBILE BOTTOM NAV (Android-style)
   Only shows items with showInBottom: true
   + FAB for Add New Item
───────────────────────────────────────── */
function MobileBottomNav() {
  const pathname = usePathname();
  const bottomItems = NAV_ITEMS.filter((i) => i.showInBottom);

  return (
    <nav className={styles.mobileBottomNav} aria-label="Bottom navigation">
      {bottomItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ""}`}
          >
            <span className={styles.mobileNavIcon}>
              <Icon paths={item.icon} size={22} />
              {item.badge !== null && (
                <span className={styles.mobileNavBadge}>{item.badge}</span>
              )}
            </span>
            <span className={styles.mobileNavLabel}>{item.label}</span>
          </Link>
        );
      })}

      {/* FAB — Add New Item — sits in the center */}
      <Link href="/listings/new" className={styles.mobileFab} aria-label="Add New Item">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </nav>
  );
}

/* ─────────────────────────────────────────
   APP SHELL — root wrapper
───────────────────────────────────────── */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* ── DESKTOP layout ── */}
      <div
        className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""}`}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
        <div className={styles.main}>
          <TopBar />
          <main className={styles.content}>{children}</main>
        </div>
      </div>

      {/* ── MOBILE layout ── */}
      <div className={styles.mobileShell}>
        <MobileTopBar />
        <main className={styles.mobileContent}>{children}</main>
        <MobileBottomNav />
      </div>
    </>
  );
}