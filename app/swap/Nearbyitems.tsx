"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Nearbyitems.module.css";
import { useAuth } from "@/context/AuthContext"; // adjust to your actual path

interface ApiItem {
  id: number;
  title: string;
  thumbnail: string | null;
  category_name: string | null;
  status: string;
  distance_km: number;
  owner: { id: number; username: string };
}

interface NearbyItemsProps {
  onSeeAll?: () => void;
  completionPercentage?: number;
}

export default function NearbyItems({ onSeeAll, completionPercentage = 0 }: NearbyItemsProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLocation = !!(user?.lat && user?.long);

  // Fetch nearby items only once we actually have coordinates
  useEffect(() => {
    if (!hasLocation) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchNearby = async () => {
      try {
        const params = new URLSearchParams({
          lat: String(user!.lat),
          long: String(user!.long),
        });
        const res = await fetch(`/api/nearby_products/?${params.toString()}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
        const data: ApiItem[] = await res.json();
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNearby();

    return () => {
      cancelled = true;
    };
  }, [hasLocation, user?.lat, user?.long]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Nearby items</h2>
        {hasLocation && (
          <Link href="/browse/nearby" onClick={onSeeAll} className={styles.seeAll}>
            See all nearby →
          </Link>
        )}
      </div>

      {!hasLocation && (
        <NoLocationState completionPercentage={completionPercentage} />
      )}
      {hasLocation && loading && <LoadingSkeleton />}
      {hasLocation && !loading && error && <ErrorState message={error} />}
      {hasLocation && !loading && !error && items.length === 0 && <EmptyState />}
      {hasLocation && !loading && !error && items.length > 0 && (
        <div className={styles.grid}>
          {items.map((item) => (
            <Link key={item.id} href={`/products/${item.id}`} className={styles.cardLink}>
              <div className={styles.card}>
                <div className={styles.thumbnail}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className={styles.thumbnailImg} />
                  ) : (
                    <span className={styles.thumbnailFallback}>📦</span>
                  )}
                </div>
                <p className={styles.cardTitle}>{item.title}</p>
                <div className={styles.meta}>
                  <span className={styles.distance}>📍 {item.distance_km} km</span>
                  <span className={styles.category}>{item.category_name ?? "General"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className={styles.grid}>
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className={styles.skeleton}>
          <div className={styles.skeletonThumb} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLineShort} />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyEmoji}>⚠️</span>
      <p className={styles.emptyTitle}>Couldn't load nearby items</p>
      <p className={styles.emptySubtitle}>{message}</p>
    </div>
  );
}

function EmptyState() {
  const [copied, setCopied] = useState(false);

  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/signup?ref=invite` : "";

  const handleInvite = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join me on this platform",
          text: "Come trade with me — join here:",
          url: inviteLink,
        });
        return;
      }
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled share or clipboard failed — no-op
    }
  };

  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyEmoji}>🤝</span>
      <p className={styles.emptyTitle}>No listings nearby… yet!</p>
      <p className={styles.emptySubtitle}>
        Invite your friends to join and start trading close to you.
      </p>
      <button onClick={handleInvite} className={styles.emptyAction}>
        {copied ? "Link copied!" : "+ Invite a friend"}
      </button>
    </div>
  );
}

function NoLocationState({
  completionPercentage,
}: {
  completionPercentage: number;
}) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * completionPercentage) / 100;

  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyEmojiPulse}>📍</span>
      <p className={styles.emptyTitle}>Add your location to see nearby items</p>
      <p className={styles.emptySubtitle}>
        We use it to match you with people trading close to you.
      </p>
      <Link href="/profile" className={styles.emptyActionWithRing}>
        <svg width="22" height="22" viewBox="0 0 22 22" className={styles.progressRing}>
          <circle cx="11" cy="11" r={radius} className={styles.progressTrack} />
          <circle
            cx="11"
            cy="11"
            r={radius}
            className={styles.progressFill}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        Complete your profile ({completionPercentage}%)
      </Link>
    </div>
  );
}