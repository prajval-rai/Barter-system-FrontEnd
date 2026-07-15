"use client";
import { useEffect, useState } from "react";
import styles from "./Dashboardhero.module.css";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface DashboardStats {
  approved_products_count: number;
  pending_barter_requests_count: number;
  completed_barter_requests_count: number;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHero() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/dashboard-stats", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            setLoading(false);
            return;
          }
          throw new Error("Failed to fetch dashboard stats");
        }

        const data: DashboardStats = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError("Could not load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const STATS = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        </svg>
      ),
      value: loading ? "—" : String(stats?.approved_products_count ?? 0),
      label: "Listed",
      sub: "Approved items you've listed",
      href: "/listings",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 16V4m0 0L3 8m4-4l4 4" />
          <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      value: loading ? "—" : String(stats?.completed_barter_requests_count ?? 0),
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
      value: loading ? "—" : String(stats?.pending_barter_requests_count ?? 0),
      label: "Offers",
      sub: "Pending offers",
      href: "/offers",
      highlight: true,
    },
  ];

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

      {error && <p className={styles.errorText}>{error}</p>}

      {/* Stat cards */}
      <div className={styles.statsRow}>
        {STATS.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`${styles.statCard} ${s.highlight ? styles.statCardHighlight : ""}`}
          >
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
