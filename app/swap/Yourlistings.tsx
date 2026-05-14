// components/home/YourListings.tsx
"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Yourlistings.module.css";

export type ListingStatus = "submitted" | "approved" | "closed" | "rejected" | "banned";

export interface Listing {
  id: number;
  title: string;
  thumbnail: string | null;
  status: ListingStatus;
  category_name: string | null;
}

interface YourListingsProps {
  onManage?: () => void;
}

const STATUS_CONFIG: Record<ListingStatus, { label: string; bg: string; color: string }> = {
  approved:  { label: "Active",    bg: "#DCFCE7", color: "#15803D" },
  submitted: { label: "Pending",   bg: "#FEF9C3", color: "#92400E" },
  closed:    { label: "Closed",    bg: "#F1F5F9", color: "#64748B" },
  rejected:  { label: "Rejected",  bg: "#FFE4E6", color: "#BE123C" },
  banned:    { label: "Banned",    bg: "#FEE2E2", color: "#991B1B" },
};



export default function YourListings({ onManage }: YourListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const base_url = process.env.NEXT_PUBLIC_BACKEND_URL

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch(`${base_url}products/my_product`, {
          credentials: "include", // sends cookies automatically
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data: Listing[] = await res.json();
        setListings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) return <p className={styles.state}>Loading your listings…</p>;
  if (error)   return <p className={styles.state}>⚠ {error}</p>;
  if (listings.length === 0) return <p className={styles.state}>No listings yet.</p>;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Your listings</h2>
        <Link href="/listings" onClick={onManage} className={styles.manageAll}>
          Manage all →
        </Link>
      </div>

      <div className={styles.grid}>
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const statusCfg = STATUS_CONFIG[listing.status] ?? {
    label: listing.status,
    bg: "#F1F5F9",
    color: "#64748B",
  };

  return (
    <Link href={`/products/${listing.id}`} className={styles.cardLink}>
      <div className={styles.card}>

        {/* Thumbnail */}
        <div className={styles.thumbnail}>
          {listing.thumbnail ? (
            <img src={listing.thumbnail} alt={listing.title} className={styles.thumbnailImg} />
          ) : (
            <span>📦</span>
          )}
        </div>

        <div>
          <p className={styles.cardTitle}>{listing.title}</p>
          <p className={styles.cardCategory}>{listing.category_name ?? "Uncategorized"}</p>
        </div>

        <div className={styles.cardFooter}>
          <span
            className={styles.statusBadge}
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>

      </div>
    </Link>
  );
}