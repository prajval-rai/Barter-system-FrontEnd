// components/home/TrustFeatures.tsx
import React from "react";
import styles from "./TrustFeatures.module.css";

interface TrustFeature {
  emoji: string;
  title: string;
  description: string;
}

const FEATURES: TrustFeature[] = [
  { emoji: "🛡️", title: "Safe swapping",       description: "Verified users and secure communication" },
  { emoji: "📍", title: "Local and easy",       description: "Find people near you for easy exchange" },
  { emoji: "💬", title: "Chat securely",        description: "In-app chat keeps your conversations private" },
  { emoji: "⚖️", title: "Fair and transparent", description: "Ratings and reviews build trust in our community" },
];

export default function TrustFeatures() {
  return (
    <section className={styles.strip}>
      <div className={styles.grid}>
        {FEATURES.map((feature) => (
          <div key={feature.title} className={styles.card}>
            <div className={styles.icon}>{feature.emoji}</div>
            <div>
              <p className={styles.title}>{feature.title}</p>
              <p className={styles.description}>{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface TrustFeature {
  emoji: string;
  title: string;
  description: string;
}




function TrustCard({ feature }: { feature: TrustFeature }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "var(--space-3)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "var(--radius-lg)",
          background: "var(--color-white)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {feature.emoji}
      </div>

      {/* Text */}
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: "var(--font-semibold)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-heading)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          {feature.title}
        </p>
        <p
          style={{
            margin: "var(--space-1) 0 0",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          {feature.description}
        </p>
      </div>
    </div>
  );
}