"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./Exchangecard.module.css";

// Loop/repeat style arrow — matches the reference icon
const RepeatSwapIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
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
const FLASH_MS = 450;

export default function ExchangeCard() {
  const router = useRouter();
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

  const handleCardClick = () => {
    router.push("/marketplace?view=map");
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        <div className={styles.bgGlow} aria-hidden="true" />

        <span className={`${styles.staticLayer} ${styles.staticLayerFar}`} aria-hidden="true" />
        <span className={`${styles.staticLayer} ${styles.staticLayerNear}`} aria-hidden="true" />

        {/* ── Card: every dimension is fixed. Nothing inside can ever change
            the card's width/height/padding — only image content swaps. ── */}
        <div
          className={styles.card}
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick();
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <div className={styles.itemCol}>
            <div className={styles.imgSlot}>
              <div key={`give-${activePair.id}`} className={`${styles.itemImgWrap} ${styles.itemImgGive} ${styles.imgSwap}`}>
                <Image
                  src={activePair.give.src}
                  alt={activePair.give.name}
                  fill
                  sizes="220px"
                  style={{ objectFit: "contain", transform: `scale(${activePair.give.scale ?? 1.3})` }}
                  priority
                />
              </div>
            </div>
            <span className={styles.itemName}>{activePair.give.name}</span>
            <span className={`${styles.tag} ${styles.tagGive}`}>{activePair.give.tag}</span>
          </div>

          <div className={styles.swapCol}>
            <span className={`${styles.swapCircle} ${isFlashing ? styles.swapCirclePulse : ""}`}>
              <RepeatSwapIcon size={22} />
            </span>
          </div>

          <div className={styles.itemCol}>
            <div className={styles.imgSlot}>
              <div key={`get-${activePair.id}`} className={`${styles.itemImgWrap} ${styles.itemImgGet} ${styles.imgSwap}`}>
                <Image
                  src={activePair.get.src}
                  alt={activePair.get.name}
                  fill
                  sizes="220px"
                  style={{ objectFit: "contain", transform: `scale(${activePair.get.scale ?? 1.3})` }}
                  priority
                />
              </div>
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