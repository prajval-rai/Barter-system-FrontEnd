"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap, Search, Moon, Sun, Menu, X, LogOut,
  User, Settings, ShieldCheck, ChevronDown,
} from "lucide-react";
import styles from "../styles/Sidebar.module.css";
import type { AuthUser } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

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
  const [searchQuery, setSearchQuery]   = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const isAdmin = user.role === "Admin";

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-usermenu]"))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const navigate = (id: string) => {
    router.push(`/${id}`);
    setShowUserMenu(false);
    setMobileMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    }
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
      <header className={styles.topBar}>

        {/* ── Mobile hamburger ── */}
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(p => !p)}
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* ── Logo ── */}
        <button className={styles.logo} onClick={() => navigate("marketplace")}>
          <div className={styles.logoIcon}>
            <Zap size={15} strokeWidth={2.8} />
          </div>
          <span className={styles.logoText}>
            BarterX<span className={styles.logoDot}>.Trade</span>
          </span>
        </button>

        {/* ── Search bar (centre) ── */}
        <form className={styles.searchWrap} onSubmit={handleSearch}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search products, categories..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </form>

        {/* ── Right actions ── */}
        <div className={styles.rightActions}>

          {/* Dark mode toggle */}
          <button
            className={styles.iconBtn}
            onClick={() => setDarkMode(p => !p)}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

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
                {/* Profile header */}
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
                <button className={styles.dropItem} onClick={() => navigate("marketplace")}>
                  <Search size={14} /> Marketplace
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
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile flyout menu ── */}
      {mobileMenuOpen && (
        <div className={styles.mobileSheet}>
          <form className={styles.mobileSearch} onSubmit={handleSearch}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search products, categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      )}

      {/* Backdrop */}
      {(showUserMenu || mobileMenuOpen) && (
        <div
          className={styles.mobileScrim}
          onClick={() => { setShowUserMenu(false); setMobileMenuOpen(false); }}
        />
      )}
    </>
  );
}