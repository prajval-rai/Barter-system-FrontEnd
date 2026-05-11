"use client";

import styles from "./Dashboardhero.module.css";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const STATS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    ),
    value: "3",
    label: "Listed",
    sub: "Items you've listed",
    href: "/listings",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4" />
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    value: "1",
    label: "Swapped",
    sub: "Successful swaps",
    href: "/swaps",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    value: "2",
    label: "Offers",
    sub: "New offers received",
    href: "/offers",
    highlight: true,
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHero() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <section className={styles.hero}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <p className={styles.greetingSub}>
          {getGreeting()}, {firstName} 👋
        </p>
        <h1 className={styles.greetingTitle}>Welcome back!</h1>
        <p className={styles.greetingCaption}>What are you swapping today?</p>
      </div>

      {/* Stat cards */}
      <div className={styles.statsRow}>
        {STATS.map((s) => (
          <Link key={s.label} href={s.href} className={`${styles.statCard} ${s.highlight ? styles.statCardHighlight : ""}`}>
            <div className={styles.statIcon}>{s.icon}</div>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statSub}>{s.sub}</span>
            </div>
            <svg className={styles.statArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}