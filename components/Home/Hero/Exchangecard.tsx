"use client";
import styles from "./Exchangecard.module.css";

const CameraIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const HeadphoneIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const SwapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

// Small line icons for the Explore category grid
const IconLaptop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></svg>
);
const IconBook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 4.5v17" /></svg>
);
const IconChair = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" /><path d="M5 12h14v5H5z" /><path d="M6 17l-1 5M18 17l1 5" /></svg>
);
const IconShirt = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3L3 7l3 3 2-1.5V21h8V8.5L18 10l3-3-5-4-2 2h-4z" /></svg>
);
const IconSports = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3v18" /></svg>
);
const IconMore = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
);

// Bottom nav icons
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
);
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
);
const IconChat = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.4A8.5 8.5 0 0 1 3 11.6 8.38 8.38 0 0 1 11.5 3a8.5 8.5 0 0 1 8.5 8.5z" /></svg>
);
const IconHeart = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
);
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
);

const categories = [
  { icon: <IconLaptop />, label: "Electronics" },
  { icon: <IconBook />, label: "Books" },
  { icon: <IconChair />, label: "Furniture" },
  { icon: <IconShirt />, label: "Clothing" },
  { icon: <IconSports />, label: "Sports" },
  { icon: <IconMore />, label: "More" },
];

const messages = [
  { name: "Riya Sharma", sub: "Camera Exchange", time: "2m", bg: "#f472b6", initial: "R" },
  { name: "Aman Verma", sub: "Book Exchange", time: "10m", bg: "#60a5fa", initial: "A" },
  { name: "Neha Patel", sub: "Headphones Swap", time: "1h", bg: "#818cf8", initial: "N" },
  { name: "Karan Singh", sub: "Furniture Exchange", time: "3h", bg: "#f87171", initial: "K" },
];

export default function ExchangeCard() {
  return (
    <div className={styles.wrap}>
      <div className={styles.stack}>
        <div className={styles.bgGlow} aria-hidden="true" />

        {/* Left ghost: Explore panel */}
        <div className={`${styles.ghostCard} ${styles.ghostLeft}`} aria-hidden="true">
          <span className={styles.ghostTitle}>Explore</span>

          <div className={styles.ghostSearch}>
            <span className={styles.ghostSearchDot} />
            <span className={styles.ghostSearchText}>Search items, users...</span>
          </div>

          <span className={styles.ghostSectionLabel}>Categories</span>
          <div className={styles.ghostCategoryGrid}>
            {categories.map((cat) => (
              <div className={styles.ghostCategoryCell} key={cat.label}>
                <span className={styles.ghostCategoryIcon}>{cat.icon}</span>
                <span className={styles.ghostCategoryLabel}>{cat.label}</span>
              </div>
            ))}
          </div>

          <span className={styles.ghostSectionLabel}>Popular Near You</span>
          <div className={styles.ghostProductRow}>
            <div className={styles.ghostProductCard}>
              <div className={styles.ghostProductThumb} style={{ background: "linear-gradient(135deg, #a78bfa, #60a5fa)" }}>📱</div>
              <span className={styles.ghostProductName}>iPhone 13</span>
              <span className={styles.ghostProductLoc}>Mumbai</span>
            </div>
            <div className={styles.ghostProductCard}>
              <div className={styles.ghostProductThumb} style={{ background: "linear-gradient(135deg, #94a3b8, #475569)" }}>🪑</div>
              <span className={styles.ghostProductName}>Office Chair</span>
              <span className={styles.ghostProductLoc}>Pune</span>
            </div>
          </div>
        </div>

        {/* Center: main Match Found card */}
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.badge}>
              <span className={styles.badgeDot} />
              Match Found!
            </span>
            <p className={styles.subtitle}>Great match for you</p>
          </div>

          <div className={styles.row}>
            <div className={styles.item}>
              <span className={styles.itemLabel}>Your Item</span>
              <div className={`${styles.itemIcon} ${styles.itemIconGive}`}>
                <CameraIcon />
              </div>
              <span className={styles.itemName}>Canon EOS 200D</span>
              <span className={`${styles.tag} ${styles.tagGive}`}>Good Condition</span>
            </div>

            <div className={styles.swapCol}>
              <span className={styles.swapCircle}>
                <SwapIcon />
              </span>
            </div>

            <div className={styles.item}>
              <span className={styles.itemLabel}>You Get</span>
              <div className={`${styles.itemIcon} ${styles.itemIconGet}`}>
                <HeadphoneIcon />
              </div>
              <span className={styles.itemName}>Sony WH-CH720N</span>
              <span className={`${styles.tag} ${styles.tagGet}`}>Like New</span>
            </div>
          </div>

          <button className={styles.ctaBtn} type="button">
            <SwapIcon />
            Start Exchange
          </button>

          <div className={styles.footer}>
            <div className={styles.avatars}>
              <span className={styles.avatar} style={{ background: "#93c5fd" }} />
              <span className={styles.avatar} style={{ background: "#a5b4fc" }} />
              <span className={styles.avatar} style={{ background: "#f9a8d4" }} />
            </div>
            <span className={styles.footerText}>24K+ successful exchanges</span>
          </div>
        </div>

        {/* Right ghost: Messages panel */}
        <div className={`${styles.ghostCard} ${styles.ghostRight}`} aria-hidden="true">
          <span className={styles.ghostTitle}>Messages</span>

          {messages.map((m) => (
            <div className={styles.ghostMsgRow} key={m.name}>
              <span className={styles.ghostMsgAvatar} style={{ background: m.bg }}>
                {m.initial}
              </span>
              <div className={styles.ghostMsgBody}>
                <span className={styles.ghostMsgName}>{m.name}</span>
                <span className={styles.ghostMsgSub}>{m.sub}</span>
              </div>
              <span className={styles.ghostMsgTime}>{m.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav bar */}
      <div className={styles.navBar} aria-hidden="true">
        <span className={styles.navIcon}><IconHome /></span>
        <span className={styles.navIcon}><IconSearch /></span>
        <span className={`${styles.navIcon} ${styles.navIconActive}`}><IconChat /></span>
        <span className={styles.navIcon}><IconHeart /></span>
        <span className={styles.navIcon}><IconUser /></span>
      </div>
    </div>
  );
}
