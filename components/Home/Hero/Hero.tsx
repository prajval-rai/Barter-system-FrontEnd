"use client";

import { useState } from "react";
import styles from "./Hero.module.css";
import LoginModal from "@/app/login/LoginModal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const MESSAGES = [
  { name: "Prajval Rai",  type: "Camera Exchange",   time: "2m",  color: "#6366F1", initial: "R" },
  { name: "Ajit Prajapti",   type: "Book Exchange",      time: "15m", color: "#0EA5E9", initial: "A" },
  { name: "Prakhar Rai",   type: "Headphones Swap",    time: "1h",  color: "#22C55E", initial: "N" },
  { name: "Nilesh Mishra",  type: "Furniture Exchange", time: "2h",  color: "#F59E0B", initial: "K" },
];

function IconElectronics() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M8 21h8M12 17v4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconBooks() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill="#22C55E" fillOpacity="0.15" stroke="#22C55E" strokeWidth="1.5"/>
    </svg>
  );
}
function IconFurniture() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h18v10H3z" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7 17v3M17 17v3M3 11h18" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconClothing() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 001 .74H6v10a1 1 0 001 1h10a1 1 0 001-1V10h2.15a1 1 0 001-.74l.58-3.57a2 2 0 00-1.35-2.23z" fill="#EC4899" fillOpacity="0.12" stroke="#EC4899" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
function IconSports() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#F97316" fillOpacity="0.12" stroke="#F97316" strokeWidth="1.5"/>
      <path d="M12 3c0 5 4 8 9 9M3 12c5 0 8 4 9 9" stroke="#F97316" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function IconGaming() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="6" fill="#8B5CF6" fillOpacity="0.12" stroke="#8B5CF6" strokeWidth="1.5"/>
      <path d="M6 12h4M8 10v4M15 12h2" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function CameraIllustration() {
  return (
    <svg width="56" height="44" viewBox="0 0 56 44" fill="none" aria-hidden="true">
      <rect x="1" y="9" width="54" height="33" rx="6" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.3"/>
      <rect x="19" y="2" width="14" height="9" rx="3.5" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1.3"/>
      <circle cx="28" cy="26" r="11" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1.2"/>
      <circle cx="28" cy="26" r="7" fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1"/>
      <circle cx="28" cy="26" r="3.5" fill="#3B82F6" opacity="0.65"/>
      <circle cx="46" cy="15" r="3" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1"/>
    </svg>
  );
}

function HeadphonesIllustration() {
  return (
    <svg width="56" height="44" viewBox="0 0 56 44" fill="none" aria-hidden="true">
      <path d="M9 30C9 17.85 17.73 8 28 8C38.27 8 47 17.85 47 30" stroke="#BFDBFE" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="2" y="26" width="11" height="16" rx="5.5" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.3"/>
      <rect x="43" y="26" width="11" height="16" rx="5.5" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.3"/>
    </svg>
  );
}

const CATEGORIES = [
  { Icon: IconElectronics, label: "Electronics", bg: "#EFF6FF", border: "#BFDBFE" },
  { Icon: IconBooks,       label: "Books",       bg: "#F0FDF4", border: "#BBF7D0" },
  { Icon: IconFurniture,   label: "Furniture",   bg: "#FFFBEB", border: "#FDE68A" },
  { Icon: IconClothing,    label: "Clothing",    bg: "#FDF2F8", border: "#FBCFE8" },
  { Icon: IconSports,      label: "Sports",      bg: "#FFF7ED", border: "#FED7AA" },
  { Icon: IconGaming,      label: "Gaming",      bg: "#F5F3FF", border: "#DDD6FE" },
];

export default function Hero() {
  const { user } = useAuth();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  /** If already logged in go to app, otherwise open login modal */
  const handleProtectedAction = () => {
    if (user) {
      router.push("/swap");   // change to your actual protected route
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <section className={styles.hero} id="home">
      <div className={styles.inner}>

        {/* ── Left: Copy ── */}
        <div className={styles.copy}>
          <span className={styles.badge}>
            <span aria-hidden="true">✦</span>&nbsp;Swap Smarter, Live Better
          </span>

          <h1 className={styles.heading}>
            Exchange What<br />You Have.<br />
            <span className={styles.highlight}>Get What You Need.</span>
          </h1>

          <p className={styles.description}>
            LenDen is a modern platform that makes swapping things simple, fair &amp; valuable.
            Because every product has a value, and every value deserves respect.
          </p>

          <div className={styles.actions}>
            {/* ✅ Opens login modal */}
            <button
              className={styles.primaryBtn}
              type="button"
              onClick={handleProtectedAction}
            >
              Start LenDen Now &nbsp;→
            </button>
            <button className={styles.outlineBtn} type="button">
              <span className={styles.playWrap}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="#1A56DB" aria-hidden="true">
                  <path d="M3 2L10 6L3 10V2Z" />
                </svg>
              </span>
              How it Works
            </button>
          </div>

          <div className={styles.trustRow}>
            <span className={styles.trustItem}><span>🏷️</span> 100% Free to Use</span>
            <span className={styles.trustItem}><span>🛡️</span> Secure &amp; Safe</span>
            <span className={styles.trustItem}><span>✓</span> Verified Users</span>
          </div>
        </div>

        {/* ── Right: Mockup ── */}
        <div className={styles.mockupArea} aria-hidden="true">

          {/* Explore Card */}
          <div className={styles.exploreCard}>
            <div className={styles.cardHeader}>
              <p className={styles.cardTitle}>Explore</p>
              <div className={styles.searchBar}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#94a3b8" strokeWidth="1.5"/>
                  <path d="M11 11L14 14" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Search items, users...</span>
              </div>
            </div>

            <div className={styles.cardSection}>
              <p className={styles.sectionLabel}>Categories</p>
              <div className={styles.catGrid}>
                {CATEGORIES.map(({ Icon, label, bg, border }) => (
                  <div key={label} className={styles.catItem}>
                    <div className={styles.catIcon} style={{ background: bg, borderColor: border }}>
                      <Icon />
                    </div>
                    <span className={styles.catLabel}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.cardSection}>
              <p className={styles.sectionLabel}>Popular Near You</p>
              <div className={styles.popGrid}>
                {[
                  { emoji: "📱", name: "iPhone 13",    loc: "@ Mumbai" },
                  { emoji: "🪑", name: "Office Chair", loc: "@ Pune" },
                ].map((p) => (
                  <div key={p.name} className={styles.popItem}>
                    <div className={styles.popImg}>{p.emoji}</div>
                    <div className={styles.popMeta}>
                      <p className={styles.popName}>{p.name}</p>
                      <p className={styles.popLoc}>{p.loc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Match Found Card */}
          <div className={styles.matchCard}>
            <p className={styles.matchTitle}>Match Found! 🎉</p>
            <p className={styles.matchSub}>Great match for you</p>

            <div className={styles.exchangeRow}>
              <div className={styles.exCol}>
                <p className={styles.colLabel}>Your Item</p>
                <div className={styles.itemBox}>
                  <div className={styles.itemImg}><CameraIllustration /></div>
                  <p className={styles.itemName}>Camera</p>
                  <span className={`${styles.itemPill} ${styles.pillGood}`}>Good Condition</span>
                </div>
              </div>

              <div className={styles.swapCircle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 16L3 12M3 12L7 8M3 12H15M17 8L21 12M21 12L17 16M21 12H9"/>
                </svg>
              </div>

              <div className={styles.exCol}>
                <p className={styles.colLabel}>You Get</p>
                <div className={styles.itemBox}>
                  <div className={styles.itemImg}><HeadphonesIllustration /></div>
                  <p className={styles.itemName}>Head Phone</p>
                  <span className={`${styles.itemPill} ${styles.pillNew}`}>Like New</span>
                </div>
              </div>
            </div>

            {/* ✅ Opens login modal */}
            <button
              className={styles.startBtn}
              type="button"
              onClick={handleProtectedAction}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 16L3 12M3 12L7 8M3 12H15M17 8L21 12M21 12L17 16M21 12H9"/>
              </svg>
              Start LenDen
            </button>

            <div className={styles.successRow}>
              <div className={styles.avatarGroup}>
                <div className={styles.av} style={{ background: "#6366f1" }}>A</div>
                <div className={styles.av} style={{ background: "#1A56DB" }}>B</div>
                <div className={styles.av} style={{ background: "#22c55e" }}>C</div>
              </div>
              <span className={styles.successText}>24K+ successful exchanges</span>
            </div>
          </div>

          {/* Messages Card */}
          <div className={styles.messagesCard}>
            <p className={styles.msgHeader}>Messages</p>
            <div className={styles.msgList}>
              {MESSAGES.map((m) => (
                <div key={m.name} className={styles.msgItem}>
                  <div className={styles.msgAv} style={{ background: m.color }}>{m.initial}</div>
                  <div className={styles.msgInfo}>
                    <p className={styles.msgName}>{m.name}</p>
                    <p className={styles.msgType}>{m.type}</p>
                  </div>
                  <span className={styles.msgTime}>{m.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ✅ Login Modal */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          router.push("/swap"); // change to your actual protected route
        }}
      />
    </section>
  );
}