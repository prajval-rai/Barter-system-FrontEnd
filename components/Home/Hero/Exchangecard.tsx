"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Exchangecard.module.css";

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
const STACK_VISIBLE = 2;

function getOffset(i: number, currentIndex: number): number {
  return (i - currentIndex + N) % N;
}

// Layer 1 (nearest) peeks right, layer 2 peeks left, alternating —
// so the deck fans out on both sides instead of stacking straight down.
const STACK_SIDE: Array<"left" | "right"> = ["right", "left", "right"];

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

        {/* ── Fanned deck: layers peek out to alternating sides, each showing
            a real preview of the pair queued up next ── */}
        <div className={styles.stackArea} aria-hidden="true">
          {PAIRS.map((pair) => {
            const offset = getOffset(pair.id - 1, currentIndex);
            if (offset === 0 || offset > STACK_VISIBLE) return null;

            const depth = offset;
            const side = STACK_SIDE[(depth - 1) % STACK_SIDE.length];
            const sideMultiplier = side === "right" ? 1 : -1;
            const translateX = sideMultiplier * (34 + depth * 14);
            const translateY = depth * 10;
            const rotate = sideMultiplier * (3 + depth * 2);
            const scale = Math.max(0.88, 0.98 - depth * 0.06);
            const opacity = Math.max(0.45, 0.9 - depth * 0.25);
            const zIndex = 10 - depth;

            return (
              <div
                key={pair.id}
                className={styles.stackLayer}
                style={{
                  transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
                  opacity,
                  zIndex,
                }}
              >
                <div className={styles.stackPreviewRow}>
                  <span className={styles.stackImgWrap}>
                    <Image src={pair.give.src} alt={pair.give.name} fill sizes="64px" style={{ objectFit: "contain", transform: `scale(${pair.give.scale ?? 1.3})` }} />
                  </span>
                  <span className={styles.stackDivider} />
                  <span className={styles.stackImgWrap}>
                    <Image src={pair.get.src} alt={pair.get.name} fill sizes="64px" style={{ objectFit: "contain", transform: `scale(${pair.get.scale ?? 1.3})` }} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Active exchange card: fades + rises in as it becomes active ── */}
        <div key={`card-${activePair.id}`} className={`${styles.activePair} ${styles.cardFadeIn}`}>
          <div className={styles.itemCol}>
            <div className={`${styles.itemImgWrap} ${styles.itemImgGive} ${styles.slideInLeft}`}>
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

          <div className={styles.itemCol}>
            <div className={`${styles.itemImgWrap} ${styles.itemImgGet} ${styles.slideInRight}`}>
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

        {/* ── Fading outgoing ghost: briefly shows the previous card fading out
            underneath, so the swap reads as fade-out → fade-in, not a jump-cut ── */}
        {isFlashing && (
          <div className={`${styles.activePair} ${styles.cardFadeOut}`} aria-hidden="true">
            <div className={styles.itemCol}>
              <div className={`${styles.itemImgWrap} ${styles.itemImgGive}`}>
                <Image src={activePair.give.src} alt="" fill sizes="240px" style={{ objectFit: "contain", transform: `scale(${activePair.give.scale ?? 1.3})` }} />
              </div>
            </div>
            <div className={styles.swapCol}>
              <span className={styles.swapCircle}>
                <StraightSwapIcon size={26} />
              </span>
            </div>
            <div className={styles.itemCol}>
              <div className={`${styles.itemImgWrap} ${styles.itemImgGet}`}>
                <Image src={activePair.get.src} alt="" fill sizes="240px" style={{ objectFit: "contain", transform: `scale(${activePair.get.scale ?? 1.3})` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <span className={styles.caption}>
        {isFlashing ? "Exchanging now…" : "Waiting to match"}
      </span>
    </div>
  );
}
