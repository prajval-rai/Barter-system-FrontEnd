"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Exchangecard.module.css";

// Straight double-headed arrow: a single line, arrowheads on both ends,
// pointing directly left (toward "give") and right (toward "get").
const StraightSwapIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 14h20" />
    <path d="M8 9l-4 5 4 5" />
    <path d="M20 9l4 5-4 5" />
  </svg>
);

const StraightArrowIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12h16M14 6l6 6-6 6" />
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
const STACK_LAYERS = 3;

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

        {/* ── Layered card silhouettes peeking out behind the active card ── */}
        <div className={styles.stackArea} aria-hidden="true">
          {Array.from({ length: STACK_LAYERS }).map((_, i) => {
            const depth = STACK_LAYERS - i; // furthest layer first
            return (
              <div
                key={i}
                className={styles.stackLayer}
                style={{
                  transform: `translate(${depth * 10}px, ${depth * 12}px)`,
                  opacity: Math.max(0.25, 0.6 - depth * 0.15),
                  zIndex: i,
                }}
              />
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
                sizes="240px"
                style={{ objectFit: "contain", transform: `scale(${activePair.give.scale ?? 1.3})` }}
                priority
              />
            </div>
            <span className={styles.itemName}>{activePair.give.name}</span>
            <span className={`${styles.tag} ${styles.tagGive}`}>{activePair.give.tag}</span>
          </div>

          {/* Center: straight double arrow, plus arrows firing outward on exchange */}
          <div className={styles.swapCol}>
            <span className={styles.flyTrackLeft}>
              {isFlashing && (
                <span className={styles.flyArrowLeft}>
                  <StraightArrowIcon size={14} />
                </span>
              )}
            </span>

            <span className={`${styles.swapCircle} ${isFlashing ? styles.swapCirclePulse : ""}`}>
              <StraightSwapIcon size={26} />
            </span>

            <span className={styles.flyTrackRight}>
              {isFlashing && (
                <span className={styles.flyArrowRight}>
                  <StraightArrowIcon size={14} />
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
                sizes="240px"
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
