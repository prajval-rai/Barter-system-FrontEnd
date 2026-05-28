"use client";

import { useState, useEffect } from "react";
import styles from "./Swaprequests.module.css";

export interface SwapMatch {
  id: string;
  title: string;
  description: string;
  user: {
    name: string;
    badge: string;
    location: string;
    distanceKm: number;
  };
  timeAgo: string;
  yourItem: {
    emoji: string;
    name: string;
    tags: string[];
    imageUrl?: string;
  };
  theirItem: {
    emoji: string;
    name: string;
    tags: string[];
    imageUrl?: string;
  };
  matchScore?: number;
  matchedVia?: { id: number; title: string };
  replaceOptions?: string[];
}

// ── Map raw API response → SwapMatch ────────────────────────────────────────
function mapApiItem(item: any): SwapMatch {
  const score: number = item.match_score ?? 0;

  let scoreLabel = "Possible match";
  if (score >= 90) scoreLabel = "Great match for you!";
  else if (score >= 70) scoreLabel = "Strong match!";
  else if (score >= 50) scoreLabel = "You might like this!";
  else if (score >= 30) scoreLabel = "Nearby match!";

  const topLabel: string =
    item.match_breakdown?.top_label ?? "Matched by category";
  const description = `Matched via ${topLabel.toLowerCase()} · Score ${score}/100`;

  // Tags for their item (the candidate / "you get")
  const theirTags: string[] = [];
  if (item.status)
    theirTags.push(
      item.status.charAt(0).toUpperCase() + item.status.slice(1)
    );
  if (item.purchase_year) theirTags.push(`Year ${item.purchase_year}`);
  if (item.category) theirTags.push(item.category);

  // FIX: Tags for YOUR item — show meaningful product attributes, NOT replace_options
  const yourTags: string[] = [];
  if (item.my_product_status)
    yourTags.push(
      item.my_product_status.charAt(0).toUpperCase() +
        item.my_product_status.slice(1)
    );
  if (item.my_product_year) yourTags.push(`Year ${item.my_product_year}`);
  if (item.my_product_category) yourTags.push(item.my_product_category);
  // Fallback: use matched_via category/type if no product meta
  if (yourTags.length === 0 && item.matched_via?.category)
    yourTags.push(item.matched_via.category);

  return {
    id: String(item.id),
    title: scoreLabel,
    description,
    user: {
      name: item.owner_name ?? "Unknown",
      badge: `Match score · ${score}%`,
      // FIX: store city separately so we don't repeat distance
      location: item.owner_city ?? item.owner_location ?? "",
      distanceKm: item.distance_km ?? 0,
    },
    timeAgo: `${score >= 80 ? "Top pick" : "Nearby"}`,
    yourItem: {
      emoji: "📦",
      name: item.matched_via?.title ?? "Your product",
      tags: yourTags.length ? yourTags : ["Your item"],
      imageUrl: item.my_product_thumbnail ?? undefined,
    },
    theirItem: {
      emoji: "🎁",
      name: item.title,
      tags: theirTags,
      imageUrl: item.thumbnail ?? undefined,
    },
    matchScore: score,
    matchedVia: item.matched_via,
    replaceOptions: item.replace_options,
  };
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className={styles.card} style={{ minHeight: 320 }}>
      <div className={styles.cardBody} style={{ gap: 24 }}>
        <div className={styles.left}>
          {[120, 80, 60, 50].map((w, i) => (
            <div
              key={i}
              style={{
                height: 14,
                width: w,
                borderRadius: 6,
                background: "var(--skeleton, #e5e7eb)",
                marginBottom: 12,
                animation: "pulse 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.right}>
          {[0, 1].map((i) => (
            <div key={i} className={styles.itemCard}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 8,
                  background: "var(--skeleton, #e5e7eb)",
                  animation: "pulse 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div
      className={styles.card}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 280,
        gap: 12,
        textAlign: "center",
        padding: 32,
      }}
    >
      <span style={{ fontSize: 48 }}>🔍</span>
      <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>No matches found</p>
      <p style={{ color: "var(--text-muted, #6b7280)", fontSize: 14, margin: 0 }}>
        {message}
      </p>
    </div>
  );
}

// ── Match score breakdown bar ────────────────────────────────────────────────
function MatchBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "#16a34a" : score >= 50 ? "#ca8a04" : "#6b7280";
  const trackColor =
    score >= 80
      ? "rgba(34,197,94,0.12)"
      : score >= 50
      ? "rgba(234,179,8,0.12)"
      : "rgba(107,114,128,0.10)";

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-text-muted, #6b7fa3)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Match strength
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}%</span>
      </div>
      <div
        style={{
          height: 7,
          borderRadius: 99,
          background: trackColor,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            borderRadius: 99,
            background: color,
            transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  onViewDetails?: (id: string) => void;
  onChat?: (id: string) => void;
  onStartExchange?: (id: string) => void;
  apiUrl?: string;
}

export default function SwapRequests({
  onViewDetails,
  onChat,
  onStartExchange,
  apiUrl = `/api/scan`,
}: Props) {
  const [matches, setMatches] = useState<SwapMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchMatches() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          let msg = `Server error ${res.status}`;
          try {
            const body = await res.json();
            msg = body?.error ?? body?.detail ?? msg;
          } catch {}
          throw new Error(msg);
        }

        const data = await res.json();

        if (!cancelled) {
          setMatches((data as any[]).map(mapApiItem));
          setIdx(0);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load matches.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMatches();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  const match = matches[idx];
  const total = matches.length;

  return (
    <section className={styles.wrap}>
      {/* Top badge row */}
      <div className={styles.topRow}>
        <div className={styles.matchBadge}>
          <span className={styles.pulseDot} aria-hidden="true" />
          {loading
            ? "Scanning…"
            : error
            ? "Error"
            : `${total} match${total !== 1 ? "es" : ""} found`}
        </div>
        {match && (
          <div className={styles.timeBadge}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {match.timeAgo}
          </div>
        )}
      </div>

      {loading && <SkeletonCard />}
      {!loading && error && <EmptyState message={error} />}
      {!loading && !error && total === 0 && (
        <EmptyState message="Try expanding your radius or adding more products." />
      )}

      {/* ── Main card ── */}
      {!loading && !error && match && (
        <div className={styles.card} key={match.id}>
          <div className={styles.cardBody}>

            {/* ── Left: title + trust signals ── */}
            <div className={styles.left}>
              {/* Score pill */}
              {match.matchScore !== undefined && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background:
                      match.matchScore >= 80
                        ? "rgba(34,197,94,0.12)"
                        : match.matchScore >= 50
                        ? "rgba(234,179,8,0.12)"
                        : "rgba(107,114,128,0.10)",
                    color:
                      match.matchScore >= 80
                        ? "#16a34a"
                        : match.matchScore >= 50
                        ? "#ca8a04"
                        : "#4b5563",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {match.matchScore}% match
                </div>
              )}

              <h2 className={styles.matchTitle}>{match.title}</h2>
              <p className={styles.matchDesc}>{match.description}</p>

              {/* Owner */}
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p className={styles.trustName}>{match.user.name}</p>
                  <p className={styles.trustSub}>{match.user.badge}</p>
                </div>
              </div>

              {/* FIX: Distance — show distance once; sub-label shows city if available */}
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p className={styles.trustName}>
                    {match.user.distanceKm.toFixed(1)} km away
                  </p>
                  {match.user.location && (
                    <p className={styles.trustSub}>{match.user.location}</p>
                  )}
                </div>
              </div>

              {/* Match strength bar — fills vertical space meaningfully */}
              {match.matchScore !== undefined && (
                <MatchBar score={match.matchScore} />
              )}

              {/* FIX: Replace options only shown once here, NOT duplicated in item tags */}
              {match.replaceOptions && match.replaceOptions.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-muted, #6b7280)",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    They want
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {match.replaceOptions.map((opt) => (
                      <span
                        key={opt}
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: "rgba(99,102,241,0.08)",
                          color: "#4f46e5",
                          fontWeight: 500,
                        }}
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FIX: Vertical divider between left info and right swap visual */}
            <div className={styles.divider} aria-hidden="true" />

            {/* ── Right: swap visual ── */}
            <div className={styles.right}>
              {/* Your item */}
              <div className={styles.itemCard}>
                <p className={styles.itemLabel}>Your item</p>
                {match.yourItem.imageUrl ? (
                  <img
                    src={match.yourItem.imageUrl}
                    alt={match.yourItem.name}
                    className={styles.itemImg}
                  />
                ) : (
                  <div className={styles.itemImgFallback} aria-hidden="true">
                    {match.yourItem.emoji}
                  </div>
                )}
                <p className={styles.itemName}>{match.yourItem.name}</p>
                <div className={styles.tags}>
                  {match.yourItem.tags.map((t) => (
                    <span key={t} className={styles.tag}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Swap arrow */}
              <div className={styles.swapMid}>
                <div className={styles.swapCircle} aria-hidden="true">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                    <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <p className={styles.swapLabel}>
                  Proposed
                  <br />
                  swap
                </p>
              </div>

              {/* Their item */}
              <div className={styles.itemCard}>
                <p className={styles.itemLabel}>You get</p>
                {match.theirItem.imageUrl ? (
                  <img
                    src={match.theirItem.imageUrl}
                    alt={match.theirItem.name}
                    className={styles.itemImg}
                  />
                ) : (
                  <div className={styles.itemImgFallback} aria-hidden="true">
                    {match.theirItem.emoji}
                  </div>
                )}
                <p className={styles.itemName}>{match.theirItem.name}</p>
                <div className={styles.tags}>
                  {match.theirItem.tags.map((t) => (
                    <span key={t} className={styles.tag}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Action bar ── */}
          <div className={styles.actions}>
            <button
              className={styles.btn}
              onClick={() => onViewDetails?.(match.id)}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              View details
            </button>
            <button
              className={styles.btn}
              onClick={() => onChat?.(match.id)}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Chat with owner
            </button>
            <button
              className={styles.btnPrimary}
              onClick={() => onStartExchange?.(match.id)}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Start exchange
            </button>

            <nav className={styles.nav} aria-label="Browse matches">
              <button
                className={styles.navBtn}
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                aria-label="Previous match"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span className={styles.navCount}>
                {idx + 1} / {total}
              </span>
              <button
                className={styles.navBtn}
                onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
                disabled={idx === total - 1}
                aria-label="Next match"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Dot indicators */}
      {!loading && !error && total > 0 && (
        <div
          className={styles.dots}
          role="tablist"
          aria-label="Match indicators"
        >
          {matches.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Match ${i + 1}`}
              className={`${styles.dotPip} ${
                i === idx ? styles.dotPipActive : ""
              }`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
