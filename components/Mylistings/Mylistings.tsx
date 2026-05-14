"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Mylistings.module.css";

interface Product {
  id: number;
  title: string;
  thumbnail: string;
  status: string;
  category_name: string;
  created_at: string;
}

interface Props {
  initialProducts: Product[];
}

type StatusFilter = "all" | "approved" | "submitted" | "rejected";

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  approved: { label: "Active",    badgeClass: "badgeActive"   },
  submitted: { label: "Pending",  badgeClass: "badgePending"  },
  rejected:  { label: "Rejected", badgeClass: "badgeRejected" },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status.toLowerCase()] ?? { label: status, badgeClass: "badgePending" };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyListings({ initialProducts }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  const products = initialProducts;

  const filtered =
    filter === "all"
      ? products
      : products.filter((p) => p.status.toLowerCase() === filter);

  const counts = {
    all:       products.length,
    approved:  products.filter((p) => p.status.toLowerCase() === "approved").length,
    submitted: products.filter((p) => p.status.toLowerCase() === "submitted").length,
    rejected:  products.filter((p) => p.status.toLowerCase() === "rejected").length,
  };

  function handleImgError(id: number) {
    setImgErrors((prev) => new Set(prev).add(id));
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Your Listings</h1>
          <span className={styles.count}>{products.length} items</span>
        </div>
        <Link href="/products/manage" className={styles.manageLink}>
          Manage all →
        </Link>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterBar}>
        {(["all", "approved", "submitted", "rejected"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter(f)}
          >
            <span className={styles.filterLabel}>
              {f === "all" ? "All" : f === "approved" ? "Active" : f === "submitted" ? "Pending" : "Rejected"}
            </span>
            <span className={`${styles.filterCount} ${filter === f ? styles.filterCountActive : ""}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📦</div>
          <p className={styles.emptyText}>No listings found</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((product, index) => {
            const status = product.status.toLowerCase();
            const { label, badgeClass } = getStatusConfig(product.status);
            const isActive = status === "approved";
            const hasError = imgErrors.has(product.id);

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className={`${styles.card} ${!isActive ? styles.cardFaded : ""}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Image */}
                <div className={styles.imageWrap}>
                  {hasError ? (
                    <div className={styles.imgFallback}>🖼️</div>
                  ) : (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className={styles.image}
                      onError={() => handleImgError(product.id)}
                    />
                  )}

                  {/* Category chip */}
                  <span className={styles.categoryChip}>
                    {product.category_name}
                  </span>

                  {/* Overlay label for non-active */}
                  {!isActive && (
                    <div className={`${styles.statusOverlay} ${styles[`overlay_${status}`]}`}>
                      {label}
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className={styles.cardBody}>
                  <h3 className={styles.productTitle}>{product.title}</h3>
                  <p className={styles.productDate}>{formatDate(product.created_at)}</p>

                  <div className={styles.cardFooter}>
                    <span className={`${styles.badge} ${styles[badgeClass]}`}>
                      {label}
                    </span>
                    <button
                      className={styles.editBtn}
                      title="Edit listing"
                      onClick={(e) => e.preventDefault()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}