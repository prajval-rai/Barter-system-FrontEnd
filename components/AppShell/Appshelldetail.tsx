"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./Appshelldetail.module.css";

/* ─── Icon helper ─────────────────────────────────────── */
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

/* ─── Avatar ──────────────────────────────────────────── */
function Avatar({ image, name, size = 32 }: { image: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {image ? (
        <Image src={image} alt={name} width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        initials
      )}
    </div>
  );
}

/* ─── Nav items ───────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Home",          href: "/swap",          badge: null, icon: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"] },
  { label: "Marketplace",   href: "/marketplace",   badge: null, icon: ["M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 01-8 0"] },
  { label: "My Listings",   href: "/listings",      badge: null, icon: ["M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2", "M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", "M9 12h6M9 16h4"] },
  { label: "My Swaps",      href: "/swaps",         badge: null, icon: ["M7 16V4m0 0L3 8m4-4l4 4", "M17 8v12m0 0l4-4m-4 4l-4-4"] },
  { label: "Messages",      href: "/messages",      badge: 2,    icon: ["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"] },
  { label: "Offers",        href: "/offers",        badge: 4,    icon: ["M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"] },
  { label: "Bookmarks",     href: "/bookmarks",     badge: null, icon: ["M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"] },
  { label: "Notifications", href: "/notifications", badge: null, icon: ["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 01-3.46 0"] },
  { label: "Profile",       href: "/profile",       badge: null, icon: ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z"] },
  { label: "Settings",      href: "/settings",      badge: null, icon: ["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"] },
];

const NAV_SECTIONS = [
  { label: "Home",     items: ["Home", "Marketplace", "My Listings", "My Swaps"] },
  { label: "Activity", items: ["Messages", "Offers", "Bookmarks", "Notifications"] },
  { label: "Account",  items: ["Profile", "Settings"] },
];

/* ─── Drawer ──────────────────────────────────────────── */
function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const getNavItem = (label: string) => NAV_ITEMS.find((i) => i.label === label)!;

  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.backdropVisible : ""}`} aria-hidden="true" />
      <div ref={drawerRef} className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`} aria-label="Navigation menu">
        <div className={styles.drawerHeader}>
          <Link href="/swap" className={styles.drawerLogo} onClick={onClose}>
            <Image
              src="/logo.png"
              alt="LenDen"
              width={120}
              height={32}
              className={styles.logoImg}
              priority
            />
          </Link>
          <button className={styles.drawerCloseBtn} onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.drawerCta}>
          <Link href="/add" className={styles.ctaBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New Item
          </Link>
        </div>

        <nav className={styles.drawerNav}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label} className={`${styles.drawerSection} ${si > 0 ? styles.drawerSectionBordered : ""}`}>
              <span className={styles.drawerSectionLabel}>{section.label}</span>
              {section.items.map((label) => {
                const item = getNavItem(label);
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.drawerNavItem} ${isActive ? styles.drawerNavItemActive : ""}`}
                    onClick={onClose}
                  >
                    <span className={styles.drawerNavIcon}><Icon paths={item.icon} size={17} /></span>
                    <span className={styles.drawerNavLabel}>{item.label}</span>
                    {item.badge !== null && <span className={styles.drawerBadge}>{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {user && (
          <div className={styles.drawerUser}>
            <div className={styles.avatarRing}><Avatar image={user.image} name={user.name} size={32} /></div>
            <div className={styles.drawerUserInfo}>
              <span className={styles.drawerUserName}>{user.name}</span>
              <span className={styles.drawerUserEmail}>{user.email}</span>
            </div>
            <button className={styles.logoutBtn} onClick={logout} aria-label="Logout">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Search Bar ──────────────────────────────────────── */
function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form className={`${styles.searchForm} ${focused ? styles.searchFormFocused : ""}`} onSubmit={handleSubmit}>
      <button type="submit" className={styles.searchIconBtn} aria-label="Search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>
      <input
        className={styles.searchInput}
        type="search"
        placeholder="Search items, users or categories..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {query && (
        <button type="button" className={styles.searchClearBtn} onClick={() => setQuery("")} aria-label="Clear">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  );
}

/* ─── Top Bar ─────────────────────────────────────────── */
function TopBar({ onHamburger }: { onHamburger: () => void }) {
  const { user } = useAuth();
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <button className={styles.hamburger} onClick={onHamburger} aria-label="Open menu">
          <span /><span /><span />
        </button>
        <Link href="/swap" className={styles.topbarLogo}>
          <Image
            src="/logo.png"
            alt="LenDen"
            width={110}
            height={28}
            className={styles.logoImg}
            priority
          />
        </Link>
      </div>
      <div className={styles.topbarCenter}><SearchBar /></div>
      <div className={styles.topbarRight}>
        <Link href="/notifications" className={styles.iconBtn} aria-label="Notifications">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className={styles.notifDot} />
        </Link>
        <Link href="/messages" className={styles.iconBtn} aria-label="Messages">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className={styles.msgBadge}>2</span>
        </Link>
        <Link href="/add" className={styles.addBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add Item</span>
        </Link>
        <Link href="/profile" className={styles.userBtn} aria-label="Profile">
          <div className={styles.avatarRing}>
            <Avatar image={user?.image ?? null} name={user?.name ?? "U"} size={30} />
          </div>
          {user && <span className={styles.userName}>{user.name.split(" ")[0]}</span>}
        </Link>
      </div>
    </header>
  );
}

/* ─── AppShellDetail ──────────────────────────────────── */
export default function AppShellDetail({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: "chat";
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={variant === "chat" ? styles.shellChat : styles.shell}>
      <TopBar onHamburger={() => setDrawerOpen(true)} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className={variant === "chat" ? styles.contentChat : styles.content}>
        {children}
      </main>
    </div>
  );
}