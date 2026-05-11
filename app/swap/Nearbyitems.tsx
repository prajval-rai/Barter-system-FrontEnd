// components/home/NearbyItems.tsx
"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Nearbyitems.module.css";

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
}

export default function NearbyItems({ onSeeAll }: NearbyItemsProps) {
  const [items, setItems]     = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const base_url = process.env.NEXT_PUBLIC_BACKEND_URL

  useEffect(() => {
    const fetchNearby = async () => {
      try {
        const res = await fetch(`${base_url}scan/nearby_products/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
        const data: ApiItem[] = await res.json();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };
    fetchNearby();
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Nearby items</h2>
        <Link href="/browse/nearby" onClick={onSeeAll} className={styles.seeAll}>
          See all nearby →
        </Link>
      </div>

      {loading && <LoadingSkeleton />}
      {error   && <ErrorState message={error} />}
      {!loading && !error && items.length === 0 && <EmptyState />}
      {!loading && !error && items.length > 0 && (
        <div className={styles.grid}>
          {items.map((item) => (
            <Link key={item.id} href={`/item/${item.id}`} className={styles.cardLink}>
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
<span className={styles.distance}>
  📍 {item.distance_km} km
</span>
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

/* ── Loading skeleton ── */
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

/* ── Error state ── */
function ErrorState({ message }: { message: string }) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyEmoji}>⚠️</span>
      <p className={styles.emptyTitle}>Couldn't load nearby items</p>
      <p className={styles.emptySubtitle}>{message}</p>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyEmoji}>🗺️</span>
      <p className={styles.emptyTitle}>Nothing nearby… yet!</p>
      <p className={styles.emptySubtitle}>
        Be the first to list something in your area and start trading.
      </p>
      <Link href="/listings/new" className={styles.emptyAction}>
        + Add your first listing
      </Link>
    </div>
  );
}