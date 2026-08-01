"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Exchangecard.module.css";

const StraightSwapIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 14h20" />
    <path d="M8 9l-4 5 4 5" />
    <path d="M20 9l4 5-4 5" />
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
const FLIP_MS = 600; // total flip duration; content swaps at the halfway point (edge-on)

type FlipPhase = "idle" | "out" | "in";

export default function ExchangeCard() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [flipPhase, setFlipPhase] = useState<FlipPhase>("idle");
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlipPhase("out");

      const half = setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % N);
        setFlipPhase("in");
      }, FLIP_MS / 2);

      const full = setTimeout(() => {
        setFlipPhase("idle");
      }, FLIP_MS);

      timeouts.current.push(half, full);
    }, CYCLE_MS);

    return () => {
      clearInterval(interval);
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, []);

  const activePair = PAIRS[currentIndex];
  const isFlipping = flipPhase !== "idle";
  const flipClass = flipPhase === "out" ? styles.flipOut : flipPhase === "in" ? styles.flipIn : "";

  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        <div className={styles.bgGlow} aria-hidden="true" />

        {/* ── Static layered edges peeking behind the card ── */}
        <span className={`${styles.staticLayer} ${styles.staticLayerFar}`} aria-hidden="true" />
        <span className={`${styles.staticLayer} ${styles.staticLayerNear}`} aria-hidden="true" />

        {/* ── Fixed-size card: position and dimensions never change ── */}
        <div className={styles.card}>
          <div className={styles.itemCol}>
            <div className={styles.flipStage}>
              <div className={`${styles.itemImgWrap} ${styles.itemImgGive} ${flipClass}`}>
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
            <span className={`${styles.swapCircle} ${isFlipping ? styles.swapCirclePulse : ""}`}>
              <StraightSwapIcon size={24} />
            </span>
          </div>

          <div className={styles.itemCol}>
            <div className={styles.flipStage}>
              <div className={`${styles.itemImgWrap} ${styles.itemImgGet} ${flipClass}`}>
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
        {isFlipping ? "Exchanging now…" : "Waiting to match"}
      </span>
    </div>
  );
}
