"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Exchangecard.module.css";

const SwapIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const ArrowIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

interface ExchangeItem {
  name: string;
  tag: string;
  src: string;
  scale?: number;
}

interface ExchangePair {
  id: number;
  give: ExchangeItem;
  get: ExchangeItem;
}

const PAIRS: ExchangePair[] = [
  {
    id: 1,
    give: { name: "Vintage Car", tag: "Good Condition", src: "/Image/LandingPage/car.png", scale: 1.35 },
    get: { name: "Model Train Set", tag: "Like New", src: "/Image/LandingPage/train.png", scale: 1.35 },
  },
  {
    id: 2,
    give: { name: "Thrill Novel Set", tag: "Well Kept", src: "/Image/LandingPage/thrill.png", scale: 1.25 },
    get: { name: "Romance Novel Set", tag: "Excellent", src: "/Image/LandingPage/romance.png", scale: 1.25 },
  },
  {
    id: 3,
    give: { name: "Headphones", tag: "Like New", src: "/Image/LandingPage/headphone.png", scale: 1.3 },
    get: { name: "Denim Jacket", tag: "Trendy", src: "/Image/LandingPage/denim.png", scale: 1.3 },
  },
];

const N = PAIRS.length;
const CYCLE_MS = 3000;
const FLASH_MS = 650;
const STACK_VISIBLE = 2;

function getOffset(i: number, currentIndex: number): number {
  return (i - currentIndex + N) % N;
}

const STACK_TILT = [6, -6, 4, -4];
const STACK_SHIFT_X = [22, -22, 34, -34];

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
      <div className={styles.stage}>
        <div className={styles.bgGlow} aria-hidden="true" />

        {/* ── Background stack: upcoming pairs peeking behind the active card ── */}
        <div className={styles.stackArea} aria-hidden="true">
          {PAIRS.map((pair) => {
            const offset = getOffset(pair.id - 1, currentIndex);
            if (offset === 0 || offset > STACK_VISIBLE) return null;

            const depth = offset;
            const tilt = STACK_TILT[(offset - 1) % STACK_TILT.length];
            const shiftX = STACK_SHIFT_X[(offset - 1) % STACK_SHIFT_X.length];
            const scale = Math.max(0.85, 0.97 - depth * 0.06);
            const translateY = -10 - depth * 8;
            const opacity = Math.max(0.5, 0.85 - depth * 0.2);
            const zIndex = 10 - depth;

            return (
              <div
                key={pair.id}
                className={styles.stackCard}
                style={{
                  transform: `translate(${shiftX}px, ${translateY}px) scale(${scale}) rotate(${tilt}deg)`,
                  opacity,
                  zIndex,
                }}
              >
                <span className={styles.stackImgWrap}>
                  <Image src={pair.give.src} alt={pair.give.name} fill sizes="60px" style={{ objectFit: "contain", transform: `scale(${pair.give.scale ?? 1.3})` }} />
                </span>
                <span className={styles.stackDivider} />
                <span className={styles.stackImgWrap}>
                  <Image src={pair.get.src} alt={pair.get.name} fill sizes="60px" style={{ objectFit: "contain", transform: `scale(${pair.get.scale ?? 1.3})` }} />
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Active exchange card ── */}
        <div className={styles.activePair}>
          {/* Give side */}
          <div className={styles.itemCol}>
            <div key={`give-${activePair.id}`} className={`${styles.itemImgWrap} ${styles.itemImgGive} ${styles.slideInLeft}`}>
              <Image
                src={activePair.give.src}
                alt={activePair.give.name}
                fill
                sizes="200px"
                style={{ objectFit: "contain", transform: `scale(${activePair.give.scale ?? 1.3})` }}
                priority
              />
            </div>
            <span className={styles.itemName}>{activePair.give.name}</span>
            <span className={`${styles.tag} ${styles.tagGive}`}>{activePair.give.tag}</span>
          </div>

          {/* Center swap column with outward-firing arrows */}
          <div className={styles.swapCol}>
            <span className={styles.flyTrackLeft}>
              {isFlashing && (
                <span className={styles.flyArrowLeft}>
                  <ArrowIcon size={14} />
                </span>
              )}
            </span>

            <span className={`${styles.swapCircle} ${isFlashing ? styles.swapCirclePulse : ""}`}>
              <SwapIcon size={22} />
            </span>

            <span className={styles.flyTrackRight}>
              {isFlashing && (
                <span className={styles.flyArrowRight}>
                  <ArrowIcon size={14} />
                </span>
              )}
            </span>
          </div>

          {/* Get side */}
          <div className={styles.itemCol}>
            <div key={`get-${activePair.id}`} className={`${styles.itemImgWrap} ${styles.itemImgGet} ${styles.slideInRight}`}>
              <Image
                src={activePair.get.src}
                alt={activePair.get.name}
                fill
                sizes="200px"
                style={{ objectFit: "contain", transform: `scale(${activePair.get.scale ?? 1.3})` }}
                priority
              />
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
