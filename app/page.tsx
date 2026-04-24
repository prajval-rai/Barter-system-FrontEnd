"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/home.module.css";
import AddProductModal from "./add-product/Addproductmodal";


const FLOATING_ITEMS = [
  { emoji: "📚", delay: 0,   x: 8,  y: 18 },
  { emoji: "🎧", delay: 0.7, x: 82, y: 10 },
  { emoji: "💻", delay: 1.3, x: 90, y: 52 },
  { emoji: "📷", delay: 1.9, x: 70, y: 82 },
  { emoji: "🎮", delay: 2.5, x: 18, y: 78 },
  { emoji: "📱", delay: 3.1, x: 4,  y: 48 },
  { emoji: "⌚", delay: 0.4, x: 46, y: 5  },
  { emoji: "🎸", delay: 1.7, x: 93, y: 30 },
];

const QUICK_CARDS = [
  {
    href: "/add-product",
    accent: "#0078ad",
    accentBg: "rgba(0,120,173,0.10)",
    title: "Add Product",
    sub: "List something to swap",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0078ad" strokeWidth="2.3" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/my-product",
    accent: "#16a34a",
    accentBg: "rgba(22,163,74,0.10)",
    title: "My Exchanges",
    sub: "Browse & manage swaps",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    href: "/my-listings",
    accent: "#d97706",
    accentBg: "rgba(217,119,6,0.10)",
    title: "My Listings",
    sub: "All your posted items",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2">
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    href: "/chats",
    accent: "#e11d48",
    accentBg: "rgba(225,29,72,0.10)",
    title: "Messages",
    sub: "Chat with traders",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

const RECENT = [
  {
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80",
    name: "Sony WH-1000XM4",
    meta: "Offered for MacBook Air",
    badge: "Pending",
    type: "pend",
    href: "/my-product",
  },
  {
    img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80&q=80",
    name: "The Alchemist",
    meta: "Swapped for Atomic Habits",
    badge: "Completed",
    type: "live",
    href: "/my-product",
  },
  {
    img: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=80&q=80",
    name: "GoPro Hero 11",
    meta: "New offer received",
    badge: "New offer",
    type: "new",
    href: "/add-product",
  },
];

const SWAP_PAIRS = [
  {
    from: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80",
    to: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=100&q=80",
    fromLabel: "Headphones",
    toLabel: "Laptop",
  },
  {
    from: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&q=80",
    to: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=100&q=80",
    fromLabel: "Book",
    toLabel: "Phone",
  },
  {
    from: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=100&q=80",
    to: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&q=80",
    fromLabel: "Camera",
    toLabel: "Headphones",
  },
];

type Phase = "idle" | "searching" | "found" | "success";

export default function HomePage() {
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good morning");
  const [pairIdx, setPairIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    function runCycle() {
      timers.push(setTimeout(() => setPhase("searching"), 400));
      timers.push(setTimeout(() => setPhase("found"),     2200));
      timers.push(setTimeout(() => setPhase("success"),   3600));
      timers.push(setTimeout(() => {
        setPhase("idle");
        setPairIdx(p => (p + 1) % SWAP_PAIRS.length);
        timers.push(setTimeout(runCycle, 800));
      }, 5200));
    }

    timers.push(setTimeout(runCycle, 600));
    return () => timers.forEach(clearTimeout);
  }, []);

  const pair = SWAP_PAIRS[pairIdx];

  return (
    <div className={styles.page}>
      {/* Ambient floating emojis */}
      <div className={styles.floatLayer} aria-hidden="true">
        {FLOATING_ITEMS.map((item, i) => (
          <span
            key={i}
            className={styles.floatItem}
            style={{ left: `${item.x}%`, top: `${item.y}%`, animationDelay: `${item.delay}s` }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <div className={styles.inner}>

        {/* ── Greeting ── */}
        <div className={styles.greeting}>
          <div className={styles.greetTime}>{greeting.toUpperCase()}</div>
          <h1 className={styles.greetName}>Welcome back 👋</h1>
          <p className={styles.greetSub}>What are you swapping today?</p>
        </div>

        {/* ── Stats ── */}
        <div className={styles.statsRow}>
          {[{ n: 3, l: "Listed" }, { n: 1, l: "Swapped" }, { n: 2, l: "Offers" }].map(s => (
            <div key={s.l} className={styles.statCard}>
              <div className={styles.statNum}>{s.n}</div>
              <div className={styles.statLbl}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── Explore animation card ── */}
        <div className={styles.exploreCard}>
          <div className={styles.exploreHeader}>
            <div>
              <div className={styles.exploreTitle}>Explore &amp; Swap</div>
              <div className={styles.exploreSub}>Finding your perfect match right now</div>
            </div>
            <div className={`${styles.pill} ${styles[`pill_${phase}`]}`}>
              {phase === "idle"      && "Ready"}
              {phase === "searching" && <><span className={styles.pillDot} />Searching…</>}
              {phase === "found"     && <><span className={styles.pillDotGreen} />Match found!</>}
              {phase === "success"   && "✓ Swapped!"}
            </div>
          </div>

          {/* Stage */}
          <div className={styles.stage}>

            {/* Radar rings behind everything */}
            <div className={`${styles.radar} ${phase === "searching" ? styles.radarOn : ""}`}>
              {[0, 0.5, 1.0].map((d, i) => (
                <div key={i} className={styles.radarRing} style={{ animationDelay: `${d}s` }} />
              ))}
            </div>

            {/* FROM */}
            <div
              className={`${styles.stageItem} ${styles.stageFrom} ${phase === "success" ? styles.itemSuccess : ""}`}
              onClick={() => router.push("/add-product")}
            >
              <div className={styles.itemFrame}>
                <img src={pair.from} alt={pair.fromLabel} className={styles.itemImg} />
              </div>
              <span className={styles.itemLabel}>{pair.fromLabel}</span>
              <span className={styles.tagBlue}>Your item</span>
            </div>

            {/* Connector */}
            <div className={styles.connector}>
              <div className={`${styles.connTrack} ${phase !== "idle" ? styles.connActive : ""}`}>
                <div className={styles.connDot} style={{ animationDelay: "0s" }} />
                <div className={styles.connDot} style={{ animationDelay: "0.4s" }} />
              </div>
              <div className={`${styles.swapBubble}
                ${phase === "found"   ? styles.bubbleFound   : ""}
                ${phase === "success" ? styles.bubbleSuccess : ""}
                ${phase === "searching" ? styles.bubbleSpin  : ""}
              `}>
                {phase === "success" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>
                )}
              </div>
              <div className={`${styles.connTrack} ${phase !== "idle" ? styles.connActive : ""}`}>
                <div className={styles.connDot} style={{ animationDelay: "0.2s" }} />
                <div className={styles.connDot} style={{ animationDelay: "0.6s" }} />
              </div>
            </div>

            {/* TO */}
            <div
              className={`${styles.stageItem} ${styles.stageTo}
                ${phase === "searching" ? styles.itemSearching : ""}
                ${(phase === "found" || phase === "success") ? styles.itemFound : ""}
              `}
              onClick={() => router.push("/my-product")}
            >
              <div className={styles.itemFrame}>
                <img src={pair.to} alt={pair.toLabel} className={styles.itemImg} />
              </div>
              <span className={styles.itemLabel}>{pair.toLabel}</span>
              <span className={styles.tagGreen}>You get</span>
            </div>
          </div>

          {/* CTA row */}
          <div className={styles.ctaRow}>
            <button onClick={() => setModalOpen(true)}>Add Item</button>
            <button className={styles.btnSwap} onClick={() => router.push("/my-product")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
              Start Exchange
            </button>
          </div>
        </div>

        {/* ── Quick nav ── */}
        <div className={styles.quickGrid}>
          {QUICK_CARDS.map(card => (
            <div
              key={card.href}
              className={styles.qCard}
              onClick={() => router.push(card.href)}
              style={{ "--accent": card.accent, "--accentBg": card.accentBg } as React.CSSProperties}
            >
              <div className={styles.qIcon}>{card.icon}</div>
              <div className={styles.qTitle}>{card.title}</div>
              <div className={styles.qSub}>{card.sub}</div>
              <div className={styles.qArrow}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent activity ── */}
        <div className={styles.secLabel}>Recent activity</div>
        <div className={styles.recentList}>
          {RECENT.map(item => (
            <div key={item.name} className={styles.recentRow} onClick={() => router.push(item.href)}>
              <img src={item.img} alt={item.name} className={styles.recentImg} />
              <div className={styles.recentInfo}>
                <div className={styles.recentName}>{item.name}</div>
                <div className={styles.recentMeta}>{item.meta}</div>
              </div>
              <div className={`${styles.badge} ${styles[`badge_${item.type}`]}`}>{item.badge}</div>
            </div>
          ))}
        </div>

      </div>
      <AddProductModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  onProductCreated={(id) => {
    setModalOpen(false);
    // optionally redirect to add_replace_options/<id>
  }}
/>
    </div>
  );
}