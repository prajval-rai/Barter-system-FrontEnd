"use client";

import styles from "./Home.module.css";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <div className={styles.icon}>⇄</div>
      <h1 className={styles.heading}>
        Welcome to your<br /><em>dashboard</em>
      </h1>
      <p className={styles.sub}>
        You're logged in. This is where your personalised feed,<br />
        active listings, and incoming offers will live.
      </p>
      <div className={styles.badge}>
        Status: <strong>authenticated</strong> — redirected from landing page
      </div>
      <button
        onClick={() => router.push("/")}
        style={{
          marginTop: 8,
          padding: "10px 24px",
          border: "1px solid rgba(15,13,10,0.12)",
          borderRadius: 100,
          background: "transparent",
          cursor: "pointer",
          fontFamily: "DM Sans, sans-serif",
          fontSize: 13,
          color: "#6b6560",
        }}
      >
        ← Back to landing
      </button>
    </div>
  );
}