"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./Exchangecard.module.css";

// ── Icons ──

type IconComponent = ({ size }: { size?: number }) => React.JSX.Element;

const CameraIcon: IconComponent = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const HeadphoneIcon: IconComponent = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);
const SwapIcon: IconComponent = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);
const IconLaptop: IconComponent = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></svg>
);
const IconBook: IconComponent = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 4.5v17" /></svg>
);
const IconChair: IconComponent = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" /><path d="M5 12h14v5H5z" /><path d="M6 17l-1 5M18 17l1 5" /></svg>
);
const IconShirt: IconComponent = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3L3 7l3 3 2-1.5V21h8V8.5L18 10l3-3-5-4-2 2h-4z" /></svg>
);
const IconSports: IconComponent = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3v18" /></svg>
);
const IconWatch: IconComponent = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="6" /><path d="M12 9v3l2 2M9 3h6M9 21h6" /></svg>
);

// ── Data: each entry is one "exchange pair" (item A ⇄ item B) ──

interface ExchangeItem {
  name: string;
  tag: string;
  Icon: IconComponent;
}

interface ExchangePair {
  id: number;
  give: ExchangeItem;
  get: ExchangeItem;
}

const PAIRS: ExchangePair[] = [
  {
    id: 1,
    give: { name: "Canon EOS 200D", tag: "Good Condition", Icon: CameraIcon },
    get: { name: "Sony WH-CH720N", tag: "Like New", Icon: HeadphoneIcon },
  },
  {
    id: 2,
    give: { name: "MacBook Air", tag: "Excellent", Icon: IconLaptop },
    get: { name: "Fiction Bundle", tag: "Well Kept", Icon: IconBook },
  },
  {
    id: 3,
    give: { name: "Office Chair", tag: "Sturdy", Icon: IconChair },
    get: { name: "Denim Jacket", tag: "Trendy", Icon: IconShirt },
  },
  {
    id: 4,
    give: { name: "Yoga Mat Set", tag: "Sports Gear", Icon: IconSports },
    get: { name: "Smart Watch", tag: "Barely Used", Icon: IconWatch },
  },
];

const N = PAIRS.length;
const CYCLE_MS = 3000; // how long a pair stays "live" before swapping out
const FLASH_MS = 650; // duration of the exchange flash/animation
const STACK_VISIBLE = 3; // how many upcoming pairs to render in the background stack

function getOffset(i: number, currentIndex: number): number {
  let raw = (i - currentIndex + N) % N;
  return raw;
}

export default function ExchangeCard() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
    };
  }, []);

  return (
    <div className={styles.wrap}>
      <span className={styles.topPill}>Live Exchanges</span>

      <div className={styles.stage}>
        <div className={styles.bgGlow} aria-hidden="true" />

        {/* ── Background stack: upcoming pairs waiting their turn ── */}
        <div className={styles.stackArea} aria-hidden="true">
          {PAIRS.map((pair) => {
            const offset = getOffset(pair.id - 1, currentIndex);
            if (offset === 0 || offset > STACK_VISIBLE) return null;

            const depth = offset; // 1 = just behind, higher = further back
            const scale = Math.max(0.55, 0.9 - depth * 0.12);
            const translateY = -depth * 16;
            const opacity = Math.max(0.15, 0.85 - depth * 0.22);
            const zIndex = 10 - depth;

            return (
              <div
                key={pair.id}
                className={styles.stackCard}
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  opacity,
                  zIndex,
                }}
              >
                <span className={styles.stackIcon}>
                  <pair.give.Icon size={16} />
                </span>
                <span className={styles.stackDivider} />
                <span className={styles.stackIcon}>
                  <pair.get.Icon size={16} />
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Active exchange: the two products currently swapping ── */}
        <div
          key={PAIRS[currentIndex].id}
          className={`${styles.activePair} ${isFlashing ? styles.activePairFlash : ""}`}
        >
          <div className={styles.itemCol}>
            <div className={`${styles.itemIcon} ${styles.itemIconGive}`}>
              <PAIRS[currentIndex].give.Icon size={26} />
            </div>
            <span className={styles.itemName}>{PAIRS[currentIndex].give.name}</span>
            <span className={`${styles.tag} ${styles.tagGive}`}>{PAIRS[currentIndex].give.tag}</span>
          </div>

          <div className={styles.swapCol}>
            <span className={`${styles.swapCircle} ${isFlashing ? styles.swapCircleActive : ""}`}>
              <SwapIcon size={18} />
            </span>
          </div>

          <div className={styles.itemCol}>
            <div className={`${styles.itemIcon} ${styles.itemIconGet}`}>
              <PAIRS[currentIndex].get.Icon size={26} />
            </div>
            <span className={styles.itemName}>{PAIRS[currentIndex].get.name}</span>
            <span className={`${styles.tag} ${styles.tagGet}`}>{PAIRS[currentIndex].get.tag}</span>
          </div>
        </div>
      </div>

      <span className={styles.caption}>
        {isFlashing ? "Exchanging now…" : "Waiting to match"}
      </span>
    </div>
  );
}
