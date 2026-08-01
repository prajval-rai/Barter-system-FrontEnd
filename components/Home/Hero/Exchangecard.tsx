"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Exchangecard.module.css";

// ── Reusable swap icon (kept as SVG since it's UI chrome, not a product) ──

const SwapIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

// ── Data: each entry is one "exchange pair" using real product images ──

interface ExchangeItem {
  name: string;
  tag: string;
  src: string;
}

interface ExchangePair {
  id: number;
  give: ExchangeItem;
  get: ExchangeItem;
}

const PAIRS: ExchangePair[] = [
  {
    id: 1,
    give: { name: "Vintage Car", tag: "Good Condition", src: "/Image/LandingPage/car.png" },
    get: { name: "Model Train Set", tag: "Like New", src: "/Image/LandingPage/train.png" },
  },
  {
    id: 2,
    give: { name: "Thrill Novel Set", tag: "Well Kept", src: "/Image/LandingPage/thrill.png" },
    get: { name: "Romance Novel Set", tag: "Excellent", src: "/Image/LandingPage/romance.png" },
  },
  {
    id: 3,
    give: { name: "Headphones", tag: "Like New", src: "/Image/LandingPage/headphone.png" },
    get: { name: "Denim Jacket", tag: "Trendy", src: "/Image/LandingPage/denim.png" },
  },
];

const N = PAIRS.length;
const CYCLE_MS = 3000; // how long a pair stays "live" before swapping out
const FLASH_MS = 650; // duration of the exchange flash/animation
const STACK_VISIBLE = 2; // how many upcoming pairs to render in the background stack

function getOffset(i: number, currentIndex: number): number {
  const raw = (i - currentIndex + N) % N;
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

  const activePair = PAIRS[currentIndex];

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
            const scale = Math.max(0.6, 0.9 - depth * 0.12);
            const translateY = -depth * 18;
            const opacity = Math.max(0.2, 0.85 - depth * 0.25);
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
                <span className={styles.stackImgWrap}>
                  <Image src={pair.give.src} alt={pair.give.name} fill sizes="28px" style={{ objectFit: "contain" }} />
                </span>
                <span className={styles.stackDivider} />
                <span className={styles.stackImgWrap}>
                  <Image src={pair.get.src} alt={pair.get.name} fill sizes="28px" style={{ objectFit: "contain" }} />
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Active exchange: the two products currently swapping ── */}
        <div
          key={activePair.id}
          className={`${styles.activePair} ${isFlashing ? styles.activePairFlash : ""}`}
        >
          <div className={styles.itemCol}>
            <div className={`${styles.itemImgWrap} ${styles.itemImgGive}`}>
              <Image src={activePair.give.src} alt={activePair.give.name} fill sizes="70px" style={{ objectFit: "contain" }} priority />
            </div>
            <span className={styles.itemName}>{activePair.give.name}</span>
            <span className={`${styles.tag} ${styles.tagGive}`}>{activePair.give.tag}</span>
          </div>

          <div className={styles.swapCol}>
            <span className={`${styles.swapCircle} ${isFlashing ? styles.swapCircleActive : ""}`}>
              <SwapIcon size={18} />
            </span>
          </div>

          <div className={styles.itemCol}>
            <div className={`${styles.itemImgWrap} ${styles.itemImgGet}`}>
              <Image src={activePair.get.src} alt={activePair.get.name} fill sizes="70px" style={{ objectFit: "contain" }} priority />
            </div>
            <span className={styles.itemName}>{activePair.get.name}</span>
            <span className={`${styles.tag} ${styles.tagGet}`}>{activePair.get.tag}</span>
          </div>
        </div>
      </div>

      <span className={styles.caption}>
        {isFlashing ? "Exchanging now…" : "Waiting to match"}
      </span>
    </div>
  );
}
