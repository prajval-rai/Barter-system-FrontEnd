"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import styles from "./Appshell.module.css";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import WhatsAppFloatButton from "@/components/WhatsAppFloatButton/WhatsAppFloatButton";

function Icon({ paths, size = 20 }: { paths: string[]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

function Avatar({ image, name, size = 32 }: { image: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={styles.avatarImg} style={{ width: size, height: size, fontSize: size * 0.32 }}>
      {image ? (
        <Image src={image} alt={name} width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        initials
      )}
    </div>
  );
}

/* ── Nav config ──
   showInBottom controls the mobile bottom nav: Home, Marketplace, Messages, Bookmarks only.
   Profile is no longer a bottom-nav tab — it's now the dropdown trigger in the mobile top bar. */
const NAV_ITEMS = [
  { label: "Home",          href: "/swap",          badge: null, showInBottom: true,  comingSoon: false, icon: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"] },
  { label: "Marketplace",   href: "/marketplace",   badge: null, showInBottom: true,  comingSoon: false, icon: ["M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 01-8 0"] },
  { label: "My Listings",   href: "/listings",      badge: null, showInBottom: false, comingSoon: false, icon: ["M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2", "M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", "M9 12h6M9 16h4"] },
  { label: "My Swaps",      href: "/swaps",         badge: null, showInBottom: false, comingSoon: false, icon: ["M7 16V4m0 0L3 8m4-4l4 4", "M17 8v12m0 0l4-4m-4 4l-4-4"] },
  { label: "Messages",      href: "/messages",      badge: 2,    showInBottom: true,  comingSoon: false, icon: ["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"] },
  { label: "Offers",        href: "/offers",        badge: null, showInBottom: false, comingSoon: true,  icon: ["M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"] },
  { label: "Bookmarks",     href: "/bookmarks",     badge: null, showInBottom: true,  comingSoon: false, icon: ["M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"] },
  { label: "Notifications", href: "/notifications", badge: null, showInBottom: false, comingSoon: false, icon: ["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 01-3.46 0"] },
  { label: "Profile",       href: "/profile",       badge: null, showInBottom: false, comingSoon: false, icon: ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z"] },
  { label: "Settings",      href: "/settings",      badge: null, showInBottom: false, comingSoon: true,  icon: ["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"] },
];

const NAV_SECTIONS = [
  { label: "Home",     items: ["Home", "Marketplace", "My Listings", "My Swaps"] },
  { label: "Activity", items: ["Messages", "Offers", "Bookmarks", "Notifications"] },
  { label: "Account",  items: ["Profile", "Settings"] },
];

/* Items shown in the mobile profile dropdown */
const PROFILE_MENU_LABELS = ["Home", "My Listings", "Profile", "Settings"];
const getNavItem = (label: string) => NAV_ITEMS.find((i) => i.label === label)!;

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
      {/* Logo */}
      <div className={styles.logoRow}>
        <Link href="/dashboard" className={styles.logoLink}>
          {!collapsed && (
            <Image
              src="/logo.png"
              alt="LenDen"
              width={120}
              height={32}
              className={styles.logoImg}
              priority
            />
          )}
        </Link>
        <button className={styles.collapseBtn} onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
      </div>

      {/* Add New Item CTA */}
      <div className={styles.ctaWrap}>
        <Link href="/add" className={styles.ctaBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {!collapsed && <span>Add New Item</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className={styles.nav} aria-label="Main navigation">
        {collapsed
          ? NAV_ITEMS.map((item) => {
              if (item.comingSoon) {
                return (
                  <div key={item.href} className={`${styles.navItem} ${styles.navItemDisabled}`} title={`${item.label} — Coming soon`}>
                    <span className={styles.navIcon}><Icon paths={item.icon} size={18} /></span>
                    <span className={`${styles.badge} ${styles.badgeCollapsed} ${styles.badgeSoon}`}>!</span>
                  </div>
                );
              }
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`} title={item.label}>
                  <span className={styles.navIcon}><Icon paths={item.icon} size={18} /></span>
                  {item.badge !== null && <span className={`${styles.badge} ${styles.badgeCollapsed}`}>{item.badge}</span>}
                </Link>
              );
            })
          : NAV_SECTIONS.map((section, si) => (
              <div key={section.label} className={`${styles.navSection} ${si > 0 ? styles.navSectionBordered : ""}`}>
                <span className={styles.navSectionLabel}>{section.label}</span>
                {section.items.map((label) => {
                  const item = getNavItem(label);

                  if (item.comingSoon) {
                    return (
                      <div key={item.href} className={`${styles.navItem} ${styles.navItemDisabled}`}>
                        <span className={styles.navIcon}><Icon paths={item.icon} size={17} /></span>
                        <span className={styles.navLabel}>{item.label}</span>
                        <span className={styles.comingSoonPill}>Soon</span>
                      </div>
                    );
                  }

                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}>
                      <span className={styles.navIcon}><Icon paths={item.icon} size={17} /></span>
                      <span className={styles.navLabel}>{item.label}</span>
                      {item.badge !== null && <span className={styles.badge}>{item.badge}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
      </nav>

      {/* User + Logout */}
      {user && (
        <div className={`${styles.sidebarUser} ${collapsed ? styles.sidebarUserCollapsed : ""}`}>
          <div className={styles.avatarRing}>
            <Avatar image={user.image} name={user.name} size={28} />
          </div>
          {!collapsed && (
            <div className={styles.sidebarUserInfo}>
              <span className={styles.sidebarUserName}>{user.name}</span>
              <span className={styles.sidebarUserEmail}>{user.email}</span>
            </div>
          )}
          {!collapsed && (
            <button className={styles.logoutBtn} onClick={logout} aria-label="Logout">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
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

function MobileTopBar() {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Close profile menu on outside click */
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  /* Expanded search mode replaces the whole row */
  if (searchOpen) {
    return (
      <header className={styles.mobileTopbar}>
        <button className={styles.iconBtn} onClick={() => setSearchOpen(false)} aria-label="Close search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={styles.mobileSearchWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Search items, users or categories..."
            className={styles.mobileSearchInput}
          />
        </div>
      </header>
    );
  }

  return (
    <header className={styles.mobileTopbar}>
      <Link href="/dashboard" className={styles.mobileLogoLink}>
        <Image
          src="/logo.png"
          alt="LenDen"
          width={100}
          height={26}
          className={styles.mobileLogoImg}
          priority
        />
      </Link>

      <div className={styles.mobileTopbarRight}>
        <button className={styles.iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </button>

        <Link href="/notifications" className={styles.iconBtn} aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className={styles.notifBadge}>3</span>
        </Link>

        {/* Profile — click opens dropdown instead of navigating directly */}
        <div className={styles.mobileProfileWrap} ref={menuRef}>
          <button
            className={styles.mobileAvatarBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Profile menu"
            aria-expanded={menuOpen}
          >
            <div className={styles.avatarRing} style={{ width: 34, height: 34 }}>
              <Avatar image={user?.image ?? null} name={user?.name ?? "U"} size={28} />
            </div>
          </button>

          {menuOpen && (
            <div className={styles.mobileProfileMenu} role="menu">
              {PROFILE_MENU_LABELS.map((label) => {
                const item = getNavItem(label);
                const displayLabel = label === "Home" ? "My LenDen" : label;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={styles.mobileProfileMenuItem}
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    <span className={styles.navIcon}><Icon paths={item.icon} size={16} /></span>
                    {displayLabel}
                  </Link>
                );
              })}
              <div className={styles.mobileProfileMenuDivider} />
              <button
                className={styles.mobileProfileMenuItem}
                onClick={() => { setMenuOpen(false); logout(); }}
                role="menuitem"
              >
                <span className={styles.navIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const bottomItems = NAV_ITEMS.filter((i) => i.showInBottom);
  const navRef = useRef<HTMLElement>(null);
  const fabRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const setPositions = () => {
      if (navRef.current) {
        document.documentElement.style.setProperty(
          "--bottom-nav-height",
          `${navRef.current.offsetHeight}px`
        );
      }
      if (fabRef.current) {
        const rect = fabRef.current.getBoundingClientRect();
        // distance from the right edge of the viewport to the FAB's right edge
        const rightOffset = window.innerWidth - rect.right;
        document.documentElement.style.setProperty("--fab-right", `${rightOffset}px`);
        document.documentElement.style.setProperty("--fab-width", `${rect.width}px`);
      }
    };

    setPositions();
    window.addEventListener("resize", setPositions);
    return () => window.removeEventListener("resize", setPositions);
  }, []);

  return (
    <nav ref={navRef} className={styles.mobileBottomNav} aria-label="Bottom navigation">
      {bottomItems.map((item) => {
        if (item.comingSoon) {
          return (
            <div key={item.href} className={`${styles.mobileNavItem} ${styles.mobileNavItemDisabled}`}>
              <span className={styles.mobileNavIcon}>
                <Icon paths={item.icon} size={22} />
              </span>
              <span className={styles.mobileNavLabel}>{item.label}</span>
              <span className={styles.mobileComingSoonPill}>Soon</span>
            </div>
          );
        }

        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ""}`}>
            <span className={styles.mobileNavIcon}>
              <Icon paths={item.icon} size={22} />
              {item.badge !== null && <span className={styles.mobileNavBadge}>{item.badge}</span>}
            </span>
            <span className={styles.mobileNavLabel}>{item.label}</span>
          </Link>
        );
      })}

      <Link ref={fabRef} href="/add" className={styles.mobileFab} aria-label="Add New Item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </nav>
  );
}
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""}`}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <main className={styles.content}>{children}</main>
      </div>
      <div className={styles.mobileShell}>
        <MobileTopBar />
        <main className={styles.mobileContent}>{children}</main>
        <MobileBottomNav />
      </div>

      {/* Rendered once, outside both shells, so it's not duplicated.
          Positioning (desktop bottom-right vs mobile above bottom nav)
          is handled entirely in WhatsAppFloatButton's own CSS. */}
      <WhatsAppFloatButton />
    </>
  );
}
