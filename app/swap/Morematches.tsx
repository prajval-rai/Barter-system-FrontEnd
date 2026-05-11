// components/home/MoreMatches.tsx
"use client"
import React from "react";
import Link from "next/link";
import styles from "./Morematches.module.css";

export interface MatchItem {
  id: string;
  emoji: string;
  emojiBg: string;
  title: string;
  condition: string;
  owner: string;
  ownerInitials: string;
  ownerColor: string;
  isOnline?: boolean;
}

interface MoreMatchesProps {
  matches?: MatchItem[];
  onView?: (id: string) => void;
}

const DEFAULT_MATCHES: MatchItem[] = [
  {
    id: "1",
    emoji: "📚",
    emojiBg: "#FEF3C7",
    title: "Atomic Habits",
    condition: "Like new",
    owner: "Riya K.",
    ownerInitials: "RK",
    ownerColor: "#10B981",
    isOnline: true,
  },
  {
    id: "2",
    emoji: "🪑",
    emojiBg: "#FEE2E2",
    title: "Office chair",
    condition: "Good condition",
    owner: "Aman T.",
    ownerInitials: "AT",
    ownerColor: "#F59E0B",
    isOnline: true,
  },
  {
    id: "3",
    emoji: "⌚",
    emojiBg: "#EDE9FE",
    title: "Apple Watch S6",
    condition: "Used",
    owner: "Neha P.",
    ownerInitials: "NP",
    ownerColor: "#6366F1",
    isOnline: false,
  },
  {
    id: "4",
    emoji: "🎸",
    emojiBg: "#DCFCE7",
    title: "Acoustic guitar",
    condition: "Good condition",
    owner: "Vikram S.",
    ownerInitials: "VS",
    ownerColor: "#22C55E",
    isOnline: true,
  },
];

export default function MoreMatches({
  matches = DEFAULT_MATCHES,
  onView,
}: MoreMatchesProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>More matches for you</h2>
        <Link href="/matches" className={styles.viewAll}>
          View all matches →
        </Link>
      </div>
      <div className={styles.grid}>
        {matches.map((item) => (
          <MatchCard key={item.id} item={item} onView={onView} />
        ))}
      </div>
    </section>
  );
}

function MatchCard({
  item,
  onView,
}: {
  item: MatchItem;
  onView?: (id: string) => void;
}) {
  return (
    <div className={styles.card}>
      <div
        className={styles.thumbnail}
        style={{ background: item.emojiBg }}
      >
        {item.emoji}
      </div>

      <div className={styles.ownerRow}>
        <div
          className={styles.ownerAvatar}
          style={{ background: item.ownerColor }}
        >
          {item.ownerInitials}
        </div>
        <span className={styles.ownerName}>{item.owner}</span>
        {item.isOnline && <span className={styles.onlineDot} />}
      </div>

      <div>
        <p className={styles.cardTitle}>{item.title}</p>
        <p className={styles.cardCondition}>{item.condition}</p>
      </div>

      <button className={styles.viewBtn} onClick={() => onView?.(item.id)}>
        View
      </button>
    </div>
  );
}