"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./Exchangecard.module.css";

// ── Icons (all accept a size prop now, so we can reuse them at any scale) ──

const CameraIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const HeadphoneIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const SwapIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const IconLaptop = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></svg>
);
const IconBook = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 4.5v17" /></svg>
);
const IconChair = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" /><path d="M5 12h14v5H5z" /><path d="M6 17l-1 5M18 17l1 5" /></svg>
);
const IconShirt = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3L3 7l3 3 2-1.5V21h8V8.5L18 10l3-3-5-4-2 2h-4z" /></svg>
);
const IconSports = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3v18" /></svg>
);

// ── Product queue data (order = exchange order, loops forever) ──

const PRODUCTS = [
  { id: 1, name: "Canon EOS 200D", tag: "Good Condition", Icon: CameraIcon },
  { id: 2, name: "Sony WH-CH720N", tag: "Like New", Icon: HeadphoneIcon },
  { id: 3, name: "MacBook Air", tag: "Excellent", Icon: IconLaptop },
  { id: 4, name: "Fiction Bundle", tag: "Well Kept", Icon: IconBook },
  { id: 5, name: "Office Chair", tag: "Sturdy", Icon: IconChair },
  { id: 6, name: "Denim Jacket", tag: "Trendy", Icon: IconShirt },
  { id: 7, name: "Yoga Mat Set", tag: "Sports Gear", Icon: IconSports },
];

const N = PRODUCTS.length;
const CYCLE_MS = 2600;     // how long a product stays "live" before swapping
const FLASH_MS = 550;      // how long the swap-flash plays before the next item takes over
const GAP_PX = 78;         // horizontal spacing between queue slots

// signed distance from the current center, e.g. -2 -1 0 1 2 (0 = center/live)
function getOffset(i, currentIndex) {
  let raw = (i - currentIndex + N) % N;
  if (raw > N / 2) raw -= N;
  return raw;
}

export default function ExchangeCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimeout = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlashing(true);
      flashTimeout.current = setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % N);
        setIsFlashing(false);
      }, FLASH_MS);
    }, CYCLE_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(flashTimeout.current);
    };
  }, []);

  return (
    <div className={styles.wrap}>
      <span className={styles.topPill}>Live Exchanges</span>

      <div className={styles.stage}>
        <div className={styles.bgGlow} aria-hidden="true" />

        <div className={styles.track}>
          {PRODUCTS.map((p) => {
            const offset = getOffset(p.id - 1, currentIndex);
            const isCenter = offset === 0;
            const abs = Math.abs(offset);

            const scale = isCenter ? 1 : Math.max(0.5, 0.88 - abs * 0.14);
            const opacity = isCenter ? 1 : Math.max(0.2, 1 - abs * 0.3);
            const translateX = offset * GAP_PX;
            const translateY = abs * 12;
            const zIndex = 10 - abs;

            const slotClass = isCenter
              ? styles.slotCenter
              : offset < 0
              ? styles.slotDone
              : styles.slotQueue;

            return (
              <div
                key={p.id}
                className={`${styles.slot} ${slotClass}`}
                style={{
                  transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                  opacity,
                  zIndex,
                }}
              >
                <div className={styles.slotIconWrap}>
                  <p.Icon size={isCenter ? 30 : 18} />
                </div>
                {isCenter && (
                  <div className={styles.slotMeta}>
                    <span className={styles.slotName}>{p.name}</span>
                    <span className={styles.slotTag}>{p.tag}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`${styles.swapFlash} ${isFlashing ? styles.swapFlashActive : ""}`}>
          <SwapIcon size={20} />
        </div>
      </div>

      <span className={styles.caption}>
        {isFlashing ? "Exchanging…" : "Waiting to match"}
      </span>
    </div>
  );
}
